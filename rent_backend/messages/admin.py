from django.contrib import admin
from .models import Conversation, Message, MessageReadStatus
@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['subject', 'participants__email']
    filter_horizontal = ['participants']
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['content', 'sender__email']
    readonly_fields = ['created_at', 'updated_at']
@admin.register(MessageReadStatus)
class MessageReadStatusAdmin(admin.ModelAdmin):
    list_display = ['message', 'user', 'read_at']
    list_filter = ['read_at']

