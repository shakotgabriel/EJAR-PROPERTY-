from rest_framework import serializers
from .models import Conversation, Message, MessageReadStatus
from users.serializers import UserSerializer
class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for Message model.
    """
    conversation = serializers.PrimaryKeyRelatedField(read_only=True)
    sender = UserSerializer(read_only=True)
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    attachment_url = serializers.SerializerMethodField()
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 'content',
            'attachment', 'attachment_url', 'is_read', 'read_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'conversation', 'sender', 'is_read', 'read_at', 'created_at', 'updated_at']
    def get_attachment_url(self, obj):
        """Return full URL for attachment if exists."""
        request = self.context.get('request')
        if obj.attachment and request:
            return request.build_absolute_uri(obj.attachment.url)
        return None
class ConversationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing conversations.
    """
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'property',
            'subject', 'last_message', 'unread_count',
            'created_at', 'updated_at'
        ]
    def get_last_message(self, obj):
        """Get the last message in the conversation."""
        last_message = obj.get_last_message()
        if last_message:
            return {
                'id': last_message.id,
                'sender': last_message.sender.get_full_name(),
                'content': last_message.content[:100],
                'created_at': last_message.created_at
            }
        return None
    def get_unread_count(self, obj):
        """Get unread message count for current user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.exclude(sender=request.user).filter(is_read=False).count()
        return 0
    def get_other_participant(self, obj):
        """Get the other participant in a two-person conversation."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other).data
        return None
class ConversationDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for conversation with messages.
    """
    participants = UserSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    other_participant = serializers.SerializerMethodField()
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'property',
            'subject', 'messages', 'created_at', 'updated_at'
        ]
    def get_other_participant(self, obj):
        """Get the other participant in a two-person conversation."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other).data
        return None
class ConversationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating conversations.
    """
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    class Meta:
        model = Conversation
        fields = ['id', 'participant_ids', 'property', 'subject']
    def validate_participant_ids(self, value):
        """Ensure at least one other participant."""
        if len(value) < 1:
            raise serializers.ValidationError("At least one other participant is required.")
        return value
    def create(self, validated_data):
        """Create conversation with participants."""
        participant_ids = validated_data.pop('participant_ids')
        request = self.context.get('request')
        conversation = Conversation.objects.create(**validated_data)
        conversation.participants.add(request.user)
        for participant_id in participant_ids:
            conversation.participants.add(participant_id)
        return conversation

