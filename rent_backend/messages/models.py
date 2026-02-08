from django.db import models
from django.conf import settings
class Conversation(models.Model):
    """
    Model for conversations between users.
    Supports one-to-one or group conversations.
    """
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations'
    )
    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations',
        help_text='Property this conversation is about (optional)'
    )
    subject = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-updated_at']
    def __str__(self):
        participant_emails = ', '.join([p.email for p in self.participants.all()[:2]])
        return f"Conversation: {participant_emails}"
    def get_last_message(self):
        """Get the last message in the conversation."""
        return self.messages.first()
    def get_other_participant(self, user):
        """Get the other participant in a two-person conversation."""
        return self.participants.exclude(id=user.id).first()
class Message(models.Model):
    """
    Model for individual messages within a conversation.
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['-created_at']
    def __str__(self):
        return f"Message from {self.sender.email} in {self.conversation.id}"
class MessageReadStatus(models.Model):
    """
    Track read status of messages for each participant.
    Allows tracking which users have read which messages.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_statuses')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ['message', 'user']
        verbose_name = 'Message Read Status'
        verbose_name_plural = 'Message Read Statuses'

