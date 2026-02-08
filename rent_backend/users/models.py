from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password
import uuid
class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, role, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, email, first_name, last_name, role='admin', password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, first_name, last_name, role, password, **extra_fields)
class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('agent', 'Agent'),
        ('landlord', 'Landlord'),
        ('tenant', 'Tenant'),
    )
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(blank=True, null=True)
    phone_verified_at = models.DateTimeField(blank=True, null=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']
    def __str__(self):
        return self.email
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    def get_short_name(self):
        return (self.first_name or "").strip()
class UserProfile(models.Model):
    BACKGROUND_STATUS = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company_name = models.CharField(max_length=255, blank=True, null=True)
    background_check_status = models.CharField(max_length=20, choices=BACKGROUND_STATUS, default='pending')
    @property
    def properties_count(self):
        if hasattr(self.user, 'properties'):
            return self.user.properties.count()
        return 0
    def __str__(self):
        return f"{self.user.email} Profile"
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    def __str__(self):
        return f"Token for {self.user.email}"
class VerificationCode(models.Model):
    CHANNEL_EMAIL = "email"
    CHANNEL_PHONE = "phone"
    CHANNEL_CHOICES = (
        (CHANNEL_EMAIL, "Email"),
        (CHANNEL_PHONE, "Phone"),
    )
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="verification_codes")
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    destination = models.CharField(max_length=255)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    last_attempt_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        indexes = [
            models.Index(fields=["user", "channel", "destination"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["used_at"]),
        ]
    def set_code(self, raw_code: str) -> None:
        self.code_hash = make_password(raw_code)
    def check_code(self, raw_code: str) -> bool:
        return check_password(raw_code, self.code_hash)
    @property
    def is_used(self) -> bool:
        return self.used_at is not None
    def __str__(self):
        return f"VerificationCode(user={self.user_id}, channel={self.channel}, dest={self.destination})"

