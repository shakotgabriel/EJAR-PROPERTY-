import datetime
from django.contrib.auth import get_user_model
import io
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase
from PIL import Image
from properties.models import Property, PropertyInquiry
User = get_user_model()
def _create_user(*, email: str, role: str):
    return User.objects.create_user(
        email=email,
        first_name="Test",
        last_name=role.title(),
        role=role,
        password="pass12345",
    )
def _property_payload(**overrides):
    base = {
        "title": "Nice place",
        "description": "A very nice place",
        "property_type": "apartment",
        "status": "available",
        "address": "123 Main St",
        "location": "Downtown",
        "city": "Riyadh",
        "country": "SA",
        "bedrooms": 2,
        "bathrooms": "1.0",
        "rent_amount": "2500.00",
        "security_deposit": "500.00",
        "parking_spaces": 1,
        "pets_allowed": False,
        "furnished": False,
        "utilities_included": False,
        "lease_duration_months": 12,
        "available_from": (timezone.now().date() + datetime.timedelta(days=7)).isoformat(),
        "is_featured": False,
    }
    base.update(overrides)
    return base
class PropertyPermissionsTests(APITestCase):
    def setUp(self):
        self.tenant = _create_user(email="tenant@example.com", role="tenant")
        self.landlord1 = _create_user(email="landlord1@example.com", role="landlord")
        self.landlord2 = _create_user(email="landlord2@example.com", role="landlord")
    def test_tenant_cannot_create_property(self):
        self.client.force_authenticate(self.tenant)
        res = self.client.post("/api/properties/", data=_property_payload(), format="json")
        self.assertEqual(res.status_code, 403)
    def test_landlord_can_create_property_and_is_owner(self):
        self.client.force_authenticate(self.landlord1)
        res = self.client.post("/api/properties/", data=_property_payload(), format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["owner"], self.landlord1.id)
    def test_only_owner_can_update_property(self):
        prop = Property.objects.create(owner=self.landlord1, **_property_payload())
        self.client.force_authenticate(self.landlord2)
        res_forbidden = self.client.patch(
            f"/api/properties/{prop.id}/",
            data={"title": "Hacked"},
            format="json",
        )
        self.assertEqual(res_forbidden.status_code, 403)
        self.client.force_authenticate(self.landlord1)
        res_ok = self.client.patch(
            f"/api/properties/{prop.id}/",
            data={"title": "Updated"},
            format="json",
        )
        self.assertEqual(res_ok.status_code, 200)
        prop.refresh_from_db()
        self.assertEqual(prop.title, "Updated")
    def test_property_image_upload_owner_only(self):
        prop = Property.objects.create(owner=self.landlord1, **_property_payload())
        img_io = io.BytesIO()
        Image.new("RGB", (2, 2), (255, 0, 0)).save(img_io, format="PNG")
        png_bytes = img_io.getvalue()
        fake_image = SimpleUploadedFile("test.png", png_bytes, content_type="image/png")
        self.client.force_authenticate(self.landlord2)
        res_forbidden = self.client.post(
            "/api/properties/images/",
            data={"property": prop.id, "image": fake_image},
            format="multipart",
        )
        self.assertEqual(res_forbidden.status_code, 403, getattr(res_forbidden, "data", None))
        fake_image2 = SimpleUploadedFile("test2.png", png_bytes, content_type="image/png")
        self.client.force_authenticate(self.landlord1)
        res_ok = self.client.post(
            "/api/properties/images/",
            data={"property": prop.id, "image": fake_image2},
            format="multipart",
        )
        self.assertEqual(res_ok.status_code, 201)
class InquiryPrivacyTests(APITestCase):
    def setUp(self):
        self.tenant1 = _create_user(email="t1@example.com", role="tenant")
        self.tenant2 = _create_user(email="t2@example.com", role="tenant")
        self.landlord1 = _create_user(email="ll1@example.com", role="landlord")
        self.landlord2 = _create_user(email="ll2@example.com", role="landlord")
        self.prop1 = Property.objects.create(owner=self.landlord1, **_property_payload(title="P1"))
        self.prop2 = Property.objects.create(owner=self.landlord2, **_property_payload(title="P2"))
    def test_only_tenant_can_create_inquiry(self):
        self.client.force_authenticate(self.landlord1)
        res_forbidden = self.client.post(
            "/api/properties/inquiries/",
            data={"property": self.prop1.id, "message": "Hello"},
            format="json",
        )
        self.assertEqual(res_forbidden.status_code, 403)
        self.client.force_authenticate(self.tenant1)
        res_ok = self.client.post(
            "/api/properties/inquiries/",
            data={"property": self.prop1.id, "message": "Interested"},
            format="json",
        )
        self.assertEqual(res_ok.status_code, 201)
    def test_inquiry_visibility_is_scoped(self):
        inquiry1 = PropertyInquiry.objects.create(property=self.prop1, inquirer=self.tenant1, message="Hi")
        PropertyInquiry.objects.create(property=self.prop2, inquirer=self.tenant2, message="Hi2")
        self.client.force_authenticate(self.tenant1)
        res_tenant = self.client.get("/api/properties/inquiries/")
        self.assertEqual(res_tenant.status_code, 200)
        self.assertEqual(len(res_tenant.data), 1)
        self.assertEqual(res_tenant.data[0]["id"], inquiry1.id)
        self.client.force_authenticate(self.landlord1)
        res_ll1 = self.client.get("/api/properties/inquiries/")
        self.assertEqual(res_ll1.status_code, 200)
        self.assertEqual(len(res_ll1.data), 1)
        self.assertEqual(res_ll1.data[0]["property"], self.prop1.id)
        self.client.force_authenticate(self.landlord2)
        res_ll2 = self.client.get("/api/properties/inquiries/")
        self.assertEqual(res_ll2.status_code, 200)
        self.assertEqual(len(res_ll2.data), 1)
        self.assertEqual(res_ll2.data[0]["property"], self.prop2.id)
    def test_inquirer_cannot_change_status(self):
        inquiry1 = PropertyInquiry.objects.create(property=self.prop1, inquirer=self.tenant1, message="Hi")
        self.client.force_authenticate(self.tenant1)
        res_forbidden = self.client.patch(
            f"/api/properties/inquiries/{inquiry1.id}/",
            data={"status": "closed"},
            format="json",
        )
        self.assertEqual(res_forbidden.status_code, 403)

