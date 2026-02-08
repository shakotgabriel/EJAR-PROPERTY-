from django.contrib import admin
from .models import (
    Property, PropertyImage, PropertyAmenity, PropertyAmenityRelation,
    PropertyFavorite, PropertyReview, PropertyInquiry
)
class PropertyImageInline(admin.TabularInline):
    """Inline admin for property images."""
    model = PropertyImage
    extra = 1
    fields = ['image', 'caption', 'order', 'is_primary']
class PropertyAmenityInline(admin.TabularInline):
    """Inline admin for property amenities."""
    model = PropertyAmenityRelation
    extra = 1
@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    """Admin interface for Property model."""
    list_display = [
        'title', 'property_type', 'city', 'rent_amount',
        'bedrooms', 'bathrooms', 'status', 'owner', 'created_at'
    ]
    list_filter = ['property_type', 'status', 'city','pets_allowed', 'furnished']
    search_fields = ['title', 'description', 'address', 'city', 'owner__email']
    readonly_fields = ['slug', 'views_count', 'created_at', 'updated_at']
    inlines = [PropertyImageInline, PropertyAmenityInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'property_type', 'status', 'owner')
        }),
        ('Location', {
            'fields': ('address', 'city', 'country')
        }),
        ('Property Details', {
            'fields': ('bedrooms', 'bathrooms')
        }),
        ('Pricing', {
            'fields': ('rent_amount', 'security_deposit')
        }),
        ('Amenities & Features', {
            'fields': ('parking_spaces', 'pets_allowed', 'furnished', 'utilities_included')
        }),
        ('Lease Information', {
            'fields': ('lease_duration_months', 'available_from')
        }),
        ('Tracking', {
            'fields': ('views_count', 'is_featured', 'created_at', 'updated_at')
        }),
    )
@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    """Admin interface for PropertyImage model."""
    list_display = ['property', 'caption', 'order', 'is_primary', 'uploaded_at']
    list_filter = ['is_primary', 'uploaded_at']
    search_fields = ['property__title', 'caption']
@admin.register(PropertyAmenity)
class PropertyAmenityAdmin(admin.ModelAdmin):
    """Admin interface for PropertyAmenity model."""
    list_display = ['name', 'icon']
    search_fields = ['name']
@admin.register(PropertyReview)
class PropertyReviewAdmin(admin.ModelAdmin):
    """Admin interface for PropertyReview model."""
    list_display = ['property', 'reviewer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['property__title', 'reviewer__email', 'title']
    readonly_fields = ['created_at', 'updated_at']
@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
    """Admin interface for PropertyInquiry model."""
    list_display = ['property', 'inquirer', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['property__title', 'inquirer__email']
    readonly_fields = ['created_at', 'updated_at']
@admin.register(PropertyFavorite)
class PropertyFavoriteAdmin(admin.ModelAdmin):
    """Admin interface for PropertyFavorite model."""
    list_display = ['user', 'property', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'property__title']

