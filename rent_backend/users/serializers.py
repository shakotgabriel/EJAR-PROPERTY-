from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, PasswordResetToken
User = get_user_model()
class UserProfileSerializer(serializers.ModelSerializer):
    properties_count = serializers.ReadOnlyField()
    class Meta:
        model = UserProfile
        fields = ['company_name', 'background_check_status', 'properties_count']
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'address', 'profile_picture', 'bio', 'role', 'is_verified',
            'date_joined', 'profile'
        ]
        read_only_fields = ['is_verified', 'date_joined', 'profile']
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    verify_via = serializers.ChoiceField(choices=["email", "phone"], required=False, write_only=True)
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'role', 'password', 'verify_via']
    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('verify_via', None)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirm = serializers.CharField(required=True)
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return data
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField()
class PasswordResetTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordResetToken
        fields = ['user', 'token', 'created_at', 'expires_at', 'used']
        read_only_fields = ['token', 'created_at']
class VerificationStartSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=["email", "phone"])
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False)
    def validate(self, data):
        channel = data.get("channel")
        if channel == "email":
            if not data.get("email"):
                raise serializers.ValidationError({"email": "Email is required for email verification."})
        if channel == "phone":
            if not data.get("phone_number"):
                raise serializers.ValidationError({"phone_number": "Phone number is required for phone verification."})
        return data
class VerificationConfirmSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=["email", "phone"])
    code = serializers.CharField(min_length=4, max_length=10)
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False)
    def validate(self, data):
        channel = data.get("channel")
        if channel == "email" and not data.get("email"):
            raise serializers.ValidationError({"email": "Email is required for email verification."})
        if channel == "phone" and not data.get("phone_number"):
            raise serializers.ValidationError({"phone_number": "Phone number is required for phone verification."})
        return data

