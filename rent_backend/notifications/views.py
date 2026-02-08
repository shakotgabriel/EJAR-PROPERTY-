from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Notification operations.
    
    list: GET /api/notifications/ - List user's notifications
    retrieve: GET /api/notifications/{id}/ - Get notification details
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        """Get notifications for current user."""
        return Notification.objects.filter(recipient=self.request.user)
    def retrieve(self, request, *args, **kwargs):
        """Get notification and mark as read."""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Get unread notifications.
        GET /api/notifications/unread/
        """
        unread = self.get_queryset().filter(is_read=False)
        page = self.paginate_queryset(unread)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(unread, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread notifications.
        GET /api/notifications/unread_count/
        """
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark notification as read.
        POST /api/notifications/{id}/mark_read/
        """
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read.
        POST /api/notifications/mark_all_read/
        """
        unread = self.get_queryset().filter(is_read=False)
        updated_count = unread.count()
        unread.update(is_read=True, read_at=timezone.now())
        return Response({'message': 'All notifications marked as read', 'count': updated_count})
    @action(detail=True, methods=['delete'])
    def delete_notification(self, request, pk=None):
        """
        Delete a notification.
        DELETE /api/notifications/{id}/delete_notification/
        """
        notification = self.get_object()
        notification.delete()
        return Response(
            {'message': 'Notification deleted'},
            status=status.HTTP_204_NO_CONTENT
        )
    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        """
        Delete all notifications for user.
        DELETE /api/notifications/delete_all/
        """
        count = self.get_queryset().count()
        self.get_queryset().delete()
        return Response({
            'message': 'All notifications deleted',
            'count': count
        })
class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notification preferences.
    
    retrieve: GET /api/notifications/preferences/ - Get user's preferences
    update: PUT /api/notifications/preferences/ - Update preferences
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    def get_object(self):
        """Get or create notification preferences for current user."""
        obj, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj
    @action(detail=False, methods=['get'])
    def my_preferences(self, request):
        """
        Get current user's notification preferences.
        GET /api/notifications/preferences/my_preferences/
        """
        preferences = self.get_object()
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
    @action(detail=False, methods=['put', 'patch'])
    def update_preferences(self, request):
        """
        Update user's notification preferences.
        PUT/PATCH /api/notifications/preferences/update_preferences/
        """
        preferences = self.get_object()
        serializer = self.get_serializer(
            preferences,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

