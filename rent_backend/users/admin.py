from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, PasswordResetToken
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin panel for User model.
    """
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'is_verified', 'date_joined']
    list_filter = ['role', 'is_active', 'is_verified', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'address', 'profile_picture', 'bio')}),
        ('Role & Status', {'fields': ('role', 'is_verified')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin panel for UserProfile model.
    """
    list_display = ['user', 'background_check_status', 'properties_count']
    list_filter = ['background_check_status']
    search_fields = ['user__email', 'company_name']
@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """
    Admin panel for PasswordResetToken model.
    """
    list_display = ['user', 'created_at', 'expires_at', 'used']
    list_filter = ['used', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at']

