import os
from typing import Optional, Dict
from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from .models import (
    Property, PropertyImage, PropertyAmenity, PropertyAmenityRelation,
    PropertyFavorite, PropertyReview, PropertyInquiry
)
User = get_user_model()
DEFAULT_PROPERTY_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024
DEFAULT_PROPERTY_IMAGE_ALLOWED_MIME_TYPES = ("image/jpeg", "image/png")
DEFAULT_PROPERTY_IMAGE_MAX_COUNT = 10
class PropertyImageSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        write_only=True,
        required=True,
    )
    class Meta:
        model = PropertyImage
        fields = ['id', 'property', 'image', 'caption', 'order', 'is_primary', 'uploaded_at']
    def validate_image(self, image):
        max_size = getattr(settings, "PROPERTY_IMAGE_MAX_SIZE_BYTES", DEFAULT_PROPERTY_IMAGE_MAX_SIZE_BYTES)
        if getattr(image, "size", 0) and image.size > max_size:
            raise serializers.ValidationError(f"Image is too large. Max size is {max_size // (1024 * 1024)}MB.")
        allowed_mimes = tuple(getattr(settings, "PROPERTY_IMAGE_ALLOWED_MIME_TYPES", DEFAULT_PROPERTY_IMAGE_ALLOWED_MIME_TYPES))
        content_type = getattr(image, "content_type", None)
        if content_type:
            if content_type not in allowed_mimes:
                raise serializers.ValidationError(f"Unsupported image type '{content_type}'. Allowed: {', '.join(allowed_mimes)}")
        else:
            ext = os.path.splitext(getattr(image, "name", ""))[1].lower()
            allowed_exts = {".jpg", ".jpeg", ".png"}
            if ext and ext not in allowed_exts:
                raise serializers.ValidationError("Unsupported file extension. Only JPEG/PNG are allowed.")
        return image
    def validate(self, attrs):
        request = self.context.get("request")
        prop = attrs.get("property")
        if request and request.user and request.user.is_authenticated and prop:
            if not request.user.is_staff and prop.owner_id != request.user.id:
                raise PermissionDenied("You do not have permission to upload images for this property.")
        if prop and self.instance is None:
            max_count = int(getattr(settings, "PROPERTY_IMAGE_MAX_COUNT", DEFAULT_PROPERTY_IMAGE_MAX_COUNT))
            current_count = PropertyImage.objects.filter(property=prop).count()
            if current_count >= max_count:
                raise serializers.ValidationError({"property": f"Maximum number of photos reached ({max_count})."})
        return attrs
class PropertyAmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyAmenity
        fields = ['id', 'name', 'icon', 'description']
class PropertyFavoriteSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = PropertyFavorite
        fields = ['id', 'user', 'user_email', 'property', 'created_at']
class PropertyReviewSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.EmailField(source='reviewer.email', read_only=True)
    class Meta:
        model = PropertyReview
        fields = [
            'id', 'property', 'reviewer', 'reviewer_email', 'rating',
            'title', 'comment', 'location_rating', 'value_rating', 'maintenance_rating',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['reviewer', 'reviewer_email', 'created_at', 'updated_at']
class PropertyInquirySerializer(serializers.ModelSerializer):
    inquirer_email = serializers.EmailField(source='inquirer.email', read_only=True)
    inquirer_name = serializers.SerializerMethodField()
    owner_phone = serializers.CharField(source='property.owner.phone_number', read_only=True)
    owner_name = serializers.SerializerMethodField()
    owner_email = serializers.EmailField(source='property.owner.email', read_only=True)
    def get_inquirer_name(self, obj):
        return f"{obj.inquirer.first_name} {obj.inquirer.last_name}".strip()
    def get_owner_name(self, obj):
        return f"{obj.property.owner.first_name} {obj.property.owner.last_name}".strip()
    class Meta:
        model = PropertyInquiry
        fields = [
            'id', 'property', 'inquirer', 'inquirer_email', 'inquirer_name',
            'message', 'phone_number', 'preferred_move_in_date', 'status',
            'owner_phone', 'owner_name', 'owner_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'inquirer',
            'inquirer_email',
            'inquirer_name',
            'owner_phone',
            'owner_name',
            'owner_email',
            'created_at',
            'updated_at',
        ]
class PropertySerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone_number', read_only=True)
    owner_name = serializers.SerializerMethodField()
    images = PropertyImageSerializer(many=True, read_only=True)
    amenities = serializers.SerializerMethodField()
    favorites_count = serializers.IntegerField(source='favorited_by.count', read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'slug', 'description', 'property_type', 'status',
            'owner', 'owner_email', 'owner_phone', 'owner_name', 'address', 'location', 'city', 'country',
            'bedrooms', 'bathrooms', 'rent_amount', 'security_deposit',
            'parking_spaces', 'pets_allowed', 'furnished', 'utilities_included',
            'lease_duration_months', 'available_from', 'views_count', 'is_featured',
            'created_at', 'updated_at', 'images', 'amenities', 'favorites_count', 'average_rating'
        ]
        read_only_fields = ['slug', 'owner', 'owner_email', 'owner_phone', 'owner_name', 'views_count', 'favorites_count', 'average_rating', 'created_at', 'updated_at']
    def validate(self, attrs):
        numeric_non_negative = [
            "bedrooms",
            "bathrooms",
            "rent_amount",
            "security_deposit",
            "parking_spaces",
            "lease_duration_months",
        ]
        errors = {}
        for field in numeric_non_negative:
            if field not in attrs:
                continue
            value = attrs.get(field)
            if value is None:
                continue
            try:
                if value < 0:
                    errors[field] = "Must be a non-negative value."
            except TypeError:
                pass
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
    def get_amenities(self, obj):
        amenities = PropertyAmenity.objects.filter(
            propertyamenityrelation__property=obj
        )
        return PropertyAmenitySerializer(amenities, many=True).data

