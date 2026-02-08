from rest_framework import serializers
from .models import Notification, NotificationPreference
class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    """
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'related_object_type', 'related_object_id',
            'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationPreference model.
    """
    class Meta:
        model = NotificationPreference
        fields = [
            'email_on_message', 'email_on_inquiry', 'email_on_review',
            'email_on_property_update', 'app_on_message', 'app_on_inquiry',
            'app_on_review', 'app_on_property_update', 'updated_at'
        ]
        read_only_fields = ['updated_at']

