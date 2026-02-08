from rest_framework import permissions
class IsParticipant(permissions.BasePermission):
    """
    Permission that checks if user is a participant in the conversation.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'participants'):
            return request.user in obj.participants.all()
        if hasattr(obj, 'conversation'):
            return request.user in obj.conversation.participants.all()
        return False

