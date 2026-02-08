from django.db import models
from django.conf import settings
class Notification(models.Model):
    """
    Model for user notifications.
    Supports various notification types and tracks read status.
    """
    NOTIFICATION_TYPES = (
        ('message', 'New Message'),
        ('inquiry', 'Property Inquiry'),
        ('inquiry_update', 'Inquiry Update'),
        ('review', 'Property Review'),
        ('property_update', 'Property Update'),
        ('system', 'System Notification'),
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    def __str__(self):
        return f"{self.get_notification_type_display()} for {self.recipient.email}"
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
class NotificationPreference(models.Model):
    """
    User preferences for notification types.
    Allows users to control which notifications they receive.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    email_on_message = models.BooleanField(default=True)
    email_on_inquiry = models.BooleanField(default=True)
    email_on_review = models.BooleanField(default=True)
    email_on_property_update = models.BooleanField(default=False)
    app_on_message = models.BooleanField(default=True)
    app_on_inquiry = models.BooleanField(default=True)
    app_on_review = models.BooleanField(default=True)
    app_on_property_update = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    def __str__(self):
        return f"Notification preferences for {self.user.email}"

