from rest_framework import permissions
class IsReviewerOrReadOnly(permissions.BasePermission):
    """Only the review author (or staff) can update/delete the review."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(obj, "reviewer", None) == request.user or request.user.is_staff
class IsInquiryParticipant(permissions.BasePermission):
    """Only the inquirer, the property owner (or staff) can access an inquiry."""
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        inquirer = getattr(obj, "inquirer", None)
        prop = getattr(obj, "property", None)
        owner = getattr(prop, "owner", None) if prop else None
        return request.user == inquirer or request.user == owner
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a property to edit it.
    Read permissions are allowed to any request.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user or request.user.is_staff
class IsLandlordOrAgentOrReadOnly(permissions.BasePermission):
    """
    Permission that allows only landlords and agents to create properties.
    All users can view properties (read-only).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated and
            request.user.role in ['landlord', 'agent']
        )
class IsPropertyOwner(permissions.BasePermission):
    """
    Permission that checks if user is the property owner.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'property'):
            return obj.property.owner == request.user or request.user.is_staff
        return obj.owner == request.user or request.user.is_staff
class IsTenant(permissions.BasePermission):
    """Only tenants (or staff) can perform the action."""
    def has_permission(self, request, view):
        if request.user and request.user.is_staff:
            return True
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "role", None) == "tenant")

