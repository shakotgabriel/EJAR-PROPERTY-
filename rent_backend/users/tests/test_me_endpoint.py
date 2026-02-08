from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
User = get_user_model()
def _create_user(*, email: str, role: str):
    return User.objects.create_user(
        email=email,
        first_name="Test",
        last_name=role.title(),
        role=role,
        password="pass12345",
    )
class MeEndpointTests(APITestCase):
    def setUp(self):
        self.user = _create_user(email="me@example.com", role="tenant")
    def test_get_and_patch_me(self):
        self.client.force_authenticate(self.user)
        res_get = self.client.get("/api/users/me/")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.data["email"], "me@example.com")
        res_patch = self.client.patch("/api/users/me/", data={"first_name": "New"}, format="json")
        self.assertEqual(res_patch.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "New")

