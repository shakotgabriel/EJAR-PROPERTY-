from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from users.models import VerificationCode
User = get_user_model()
class VerificationFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="verifyme@example.com",
            first_name="Verify",
            last_name="Me",
            role="tenant",
            password="pass12345",
            phone_number="+211000000000",
        )
    def test_login_blocked_when_unverified(self):
        res = self.client.post(
            "/api/users/login/",
            data={"email": "verifyme@example.com", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)
        self.assertTrue(res.data.get("verification_required"))
    def test_verify_confirm_marks_user_verified_and_returns_tokens(self):
        code_obj = VerificationCode(
            user=self.user,
            channel=VerificationCode.CHANNEL_EMAIL,
            destination=self.user.email,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        code_obj.set_code("123456")
        code_obj.save()
        res = self.client.post(
            "/api/users/verify/confirm/",
            data={"channel": "email", "email": self.user.email, "code": "123456"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertIn("user", res.data)
    def test_verify_start_does_not_enumerate_accounts(self):
        res = self.client.post(
            "/api/users/verify/start/",
            data={"channel": "email", "email": "doesnotexist@example.com"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("detail", res.data)

