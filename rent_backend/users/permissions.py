from rest_framework import permissions
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners to edit their profile.
    Read-only permissions are allowed for any request.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_staff:
            return True
        if hasattr(obj, "email") and hasattr(obj, "pk"):
            return obj.pk == request.user.pk
        return getattr(obj, "owner", None) == request.user
class IsOwner(permissions.BasePermission):
    """
    Permission that only allows users to access their own resources.
    """
    def has_object_permission(self, request, view, obj):
        return getattr(obj, "user", None) == request.user or request.user.is_staff
class IsLandlordOrAgent(permissions.BasePermission):
    """
    Permission that only allows landlords and agents to access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['landlord', 'agent']
class IsTenant(permissions.BasePermission):
    """
    Permission that only allows tenants to access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'tenant'

