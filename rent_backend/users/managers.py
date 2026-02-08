from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone
class UserManager(BaseUserManager):
    """
    Custom user manager for email-based authentication.
    """
    def _create_user(self, email, password, role, **extra_fields):
        if not email:
            raise ValueError("Email address must be provided.")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.date_joined = timezone.now()
        user.save(using=self._db)
        return user
    def create_user(self, email, password=None, role='tenant', **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, role, **extra_fields)
    def create_superuser(self, email, password=None, role='admin', **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, role, **extra_fields)

