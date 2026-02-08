from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from notifications.models import Notification
User = get_user_model()
def _create_user(*, email: str, role: str):
    return User.objects.create_user(
        email=email,
        first_name="Test",
        last_name=role.title(),
        role=role,
        password="pass12345",
    )
class NotificationsApiTests(APITestCase):
    def setUp(self):
        self.user = _create_user(email="n@example.com", role="tenant")
    def test_unread_count_and_mark_all_read(self):
        Notification.objects.create(
            recipient=self.user,
            notification_type="system",
            title="A",
            message="M",
        )
        Notification.objects.create(
            recipient=self.user,
            notification_type="system",
            title="B",
            message="M",
        )
        self.client.force_authenticate(self.user)
        res_count = self.client.get("/api/notifications/unread_count/")
        self.assertEqual(res_count.status_code, 200)
        self.assertEqual(res_count.data["unread_count"], 2)
        res_mark = self.client.post("/api/notifications/mark_all_read/")
        self.assertEqual(res_mark.status_code, 200)
        self.assertEqual(res_mark.data["count"], 2)
        res_count2 = self.client.get("/api/notifications/unread_count/")
        self.assertEqual(res_count2.data["unread_count"], 0)

