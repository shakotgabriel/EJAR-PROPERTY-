from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.utils import timezone
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer, ConversationDetailSerializer,
    ConversationCreateSerializer, MessageSerializer
)
from .permissions import IsParticipant
from notifications.utils import create_notification
class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Conversation CRUD operations.
    
    list: GET /api/messages/conversations/ - List user's conversations
    retrieve: GET /api/messages/conversations/{id}/ - Get conversation details
    create: POST /api/messages/conversations/ - Start new conversation
    """
    permission_classes = [IsAuthenticated, IsParticipant]
    def get_queryset(self):
        """Get conversations where user is a participant."""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages__sender').distinct()
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ConversationListSerializer
        elif self.action == 'create':
            return ConversationCreateSerializer
        return ConversationDetailSerializer
    def retrieve(self, request, *args, **kwargs):
        """Get conversation and mark messages as read."""
        conversation = self.get_object()
        unread_messages = conversation.messages.exclude(
            sender=request.user
        ).filter(is_read=False)
        for message in unread_messages:
            message.is_read = True
            message.read_at = timezone.now()
        Message.objects.bulk_update(unread_messages, ['is_read', 'read_at'])
        if hasattr(conversation, "_prefetched_objects_cache"):
            conversation._prefetched_objects_cache = {}
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def send_message(self, request, pk=None):
        """
        Send a message in a conversation.
        POST /api/messages/conversations/{id}/send_message/
        """
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        message = serializer.save(
            conversation=conversation,
            sender=request.user
        )
        conversation.updated_at = timezone.now()
        conversation.save()
        other_participants = conversation.participants.exclude(id=request.user.id)
        for participant in other_participants:
            create_notification(
                recipient=participant,
                notification_type='message',
                title='New Message',
                message=f'{request.user.get_full_name()} sent you a message',
                related_object_type='conversation',
                related_object_id=conversation.id
            )
        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get total unread message count for user.
        GET /api/messages/conversations/unread_count/
        """
        unread = Message.objects.filter(
            conversation__participants=request.user
        ).exclude(sender=request.user).filter(is_read=False).count()
        return Response({'unread_count': unread})
class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Message operations.
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        """Get messages from user's conversations."""
        return Message.objects.filter(
            conversation__participants=self.request.user
        ).select_related('sender', 'conversation')
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark a message as read.
        POST /api/messages/{id}/mark_read/
        """
        message = self.get_object()
        if message.sender != request.user:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()
        serializer = self.get_serializer(message)
        return Response(serializer.data)

