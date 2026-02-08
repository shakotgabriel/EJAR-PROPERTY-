import datetime
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from notifications.models import Notification
from properties.models import Property
User = get_user_model()
def _create_user(*, email: str, role: str):
    return User.objects.create_user(
        email=email,
        first_name="Test",
        last_name=role.title(),
        role=role,
        password="pass12345",
    )
def _create_property(owner):
    return Property.objects.create(
        owner=owner,
        title="P",
        description="D",
        property_type="apartment",
        status="available",
        address="123",
        location="",
        city="Riyadh",
        country="SA",
        bedrooms=1,
        bathrooms="1.0",
        rent_amount="1000.00",
        security_deposit="100.00",
        parking_spaces=0,
        pets_allowed=False,
        furnished=False,
        utilities_included=False,
        lease_duration_months=12,
        available_from=(timezone.now().date() + datetime.timedelta(days=1)),
        is_featured=False,
    )
class MessagesApiTests(APITestCase):
    def setUp(self):
        self.tenant = _create_user(email="tenant@example.com", role="tenant")
        self.landlord = _create_user(email="landlord@example.com", role="landlord")
        self.prop = _create_property(self.landlord)
    def test_create_conversation_and_send_message_creates_notification(self):
        self.client.force_authenticate(self.tenant)
        res_create = self.client.post(
            "/api/messages/conversations/",
            data={"participant_ids": [self.landlord.id], "property": self.prop.id, "subject": "Q"},
            format="json",
        )
        self.assertEqual(res_create.status_code, 201)
        conversation_id = res_create.data["id"]
        res_send = self.client.post(
            f"/api/messages/conversations/{conversation_id}/send_message/",
            data={"content": "Hello"},
            format="json",
        )
        self.assertEqual(res_send.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.landlord,
                notification_type="message",
                related_object_type="conversation",
                related_object_id=conversation_id,
            ).exists()
        )
    def test_retrieve_marks_messages_read(self):
        self.client.force_authenticate(self.tenant)
        res_create = self.client.post(
            "/api/messages/conversations/",
            data={"participant_ids": [self.landlord.id], "property": self.prop.id, "subject": "Q"},
            format="json",
        )
        conversation_id = res_create.data["id"]
        self.client.post(
            f"/api/messages/conversations/{conversation_id}/send_message/",
            data={"content": "Hello"},
            format="json",
        )
        self.client.force_authenticate(self.landlord)
        res_retrieve = self.client.get(f"/api/messages/conversations/{conversation_id}/")
        self.assertEqual(res_retrieve.status_code, 200)
        messages = res_retrieve.data.get("messages", [])
        self.assertGreaterEqual(len(messages), 1)
        self.assertTrue(messages[0]["is_read"])

