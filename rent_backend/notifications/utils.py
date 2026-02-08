from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, NotificationPreference
def create_notification(recipient, notification_type, title, message,
                       related_object_type='', related_object_id=None):
    """
    Create a notification for a user.
    
    Args:
        recipient: User object who will receive the notification
        notification_type: Type of notification (from NOTIFICATION_TYPES)
        title: Notification title
        message: Notification message
        related_object_type: Type of related object (optional)
        related_object_id: ID of related object (optional)
    
    Returns:
        Notification object
    """
    try:
        prefs = recipient.notification_preferences
    except NotificationPreference.DoesNotExist:
        prefs = NotificationPreference.objects.create(user=recipient)
    notification = None
    preference_map = {
        'message': 'app_on_message',
        'inquiry': 'app_on_inquiry',
        'inquiry_update': 'app_on_inquiry',
        'review': 'app_on_review',
        'property_update': 'app_on_property_update',
        'system': True,
    }
    should_create_app = preference_map.get(notification_type)
    if should_create_app is True or (should_create_app and getattr(prefs, should_create_app, True)):
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            related_object_type=related_object_type,
            related_object_id=related_object_id
        )
    email_preference_map = {
        'message': 'email_on_message',
        'inquiry': 'email_on_inquiry',
        'inquiry_update': 'email_on_inquiry',
        'review': 'email_on_review',
        'property_update': 'email_on_property_update',
    }
    email_pref = email_preference_map.get(notification_type)
    if email_pref and getattr(prefs, email_pref, False):
        try:
            send_email_notification(recipient.email, title, message)
        except Exception as e:
            pass
    return notification
def send_email_notification(recipient_email, subject, message):
    """
    Send email notification to user.
    
    Args:
        recipient_email: Email address to send to
        subject: Email subject
        message: Email message
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Failed to send email to {recipient_email}: {str(e)}")

