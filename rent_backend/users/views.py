from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, PasswordResetToken
from .models import VerificationCode
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    VerificationStartSerializer, VerificationConfirmSerializer
)
from .permissions import IsOwner, IsOwnerOrReadOnly, IsLandlordOrAgent, IsTenant
import datetime
from django.core.mail import send_mail
from django.conf import settings
import logging
from django.db import transaction
import uuid
from .verification import create_and_send_code, mask_destination, get_verification_config
User = get_user_model()
logger = logging.getLogger(__name__)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    def perform_create(self, serializer):
        user = serializer.save()
        channel = self.request.data.get("verify_via")
        if channel not in (VerificationCode.CHANNEL_EMAIL, VerificationCode.CHANNEL_PHONE):
            channel = VerificationCode.CHANNEL_EMAIL
        if channel == VerificationCode.CHANNEL_PHONE and not user.phone_number:
            channel = VerificationCode.CHANNEL_EMAIL
        destination = user.email if channel == VerificationCode.CHANNEL_EMAIL else (user.phone_number or "")
        if destination:
            create_and_send_code(user=user, channel=channel, destination=destination)
        self._verification_channel = channel
        self._verification_destination = destination
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        channel = getattr(self, "_verification_channel", VerificationCode.CHANNEL_EMAIL)
        destination = getattr(self, "_verification_destination", "")
        return Response(
            {
                "detail": "Account created. Verification required.",
                "verification_required": True,
                "channel": channel,
                "destination": mask_destination(destination, channel),
            },
            status=status.HTTP_201_CREATED,
        )
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
    def post(self, request):
        request_id = str(uuid.uuid4())
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            email = (serializer.validated_data["email"] or "").strip().lower()
            password = serializer.validated_data["password"]

            user = User.objects.filter(email__iexact=email).order_by("id").first()
            if not user:
                return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            if not user.is_active:
                return Response({"detail": "Account is inactive"}, status=status.HTTP_403_FORBIDDEN)
            if not user.check_password(password):
                return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            if not user.is_verified:
                return Response(
                    {
                        "detail": "Account not verified.",
                        "verification_required": True,
                        "email": user.email,
                        "phone_number": user.phone_number,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            logger.exception("Login error (request_id=%s)", request_id)
            payload = {"detail": "An error occurred during login", "request_id": request_id}
            if getattr(settings, "DEBUG", False):
                # In DEBUG, Django/DRF will already show more detail; this keeps API clients readable.
                payload["debug"] = "Check server logs for stack trace"
            return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                try:
                    token.blacklist()
                except Exception:
                    pass
            return Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = [IsAuthenticated]
    def get_object(self, queryset=None):
        return self.request.user
    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not self.object.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)
        self.object.set_password(serializer.validated_data['new_password'])
        self.object.save()
        return Response({'detail': 'Password updated successfully'}, status=status.HTTP_200_OK)
    def post(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    def post(self, request, token=None):
        if token:
            try:
                token_obj = PasswordResetToken.objects.get(token=token, used=False)
                if token_obj.expires_at < timezone.now():
                    return Response({'detail': 'Token expired'}, status=status.HTTP_400_BAD_REQUEST)
                new_password = request.data.get('new_password')
                if not new_password:
                    return Response({'detail': 'new_password is required'}, status=status.HTTP_400_BAD_REQUEST)
                user = token_obj.user
                user.set_password(new_password)
                user.save()
                token_obj.used = True
                token_obj.save()
                return Response({'detail': 'Password reset successfully'}, status=status.HTTP_200_OK)
            except PasswordResetToken.DoesNotExist:
                return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'detail': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        role = self.kwargs.get('role')
        return User.objects.filter(role=role)
class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'If an account exists for this email, a reset link has been sent.'}, status=status.HTTP_200_OK)
        expires_at = timezone.now() + datetime.timedelta(hours=1)
        token_obj = PasswordResetToken.objects.create(user=user, expires_at=expires_at)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{token_obj.token}/"
        try:
            send_mail(
                subject='Password Reset Request',
                message=f'Hello {user.first_name},\n\nUse this link to reset your password: {reset_link}\n\nThe link expires in 1 hour.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Failed to send password reset email")
        return Response({'detail': 'If an account exists for this email, a reset link has been sent.'}, status=status.HTTP_200_OK)
class VerificationStartView(generics.GenericAPIView):
    serializer_class = VerificationStartSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "verification_start"
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        channel = serializer.validated_data["channel"]
        email = serializer.validated_data.get("email")
        phone_number = serializer.validated_data.get("phone_number")
        user = None
        destination = ""
        if channel == VerificationCode.CHANNEL_EMAIL:
            destination = (email or "").strip().lower()
            try:
                user = User.objects.get(email=destination)
            except User.DoesNotExist:
                user = None
        else:
            destination = (phone_number or "").strip()
            try:
                user = User.objects.get(phone_number=destination)
            except User.DoesNotExist:
                user = None
        if not user or user.is_verified:
            return Response({"detail": "If an account exists, a code has been sent."}, status=status.HTTP_200_OK)
        create_and_send_code(user=user, channel=channel, destination=destination)
        return Response(
            {
                "detail": "If an account exists, a code has been sent.",
                "destination": mask_destination(destination, channel),
                "channel": channel,
            },
            status=status.HTTP_200_OK,
        )
class VerificationConfirmView(generics.GenericAPIView):
    serializer_class = VerificationConfirmSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "verification_confirm"
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        channel = serializer.validated_data["channel"]
        raw_code = serializer.validated_data["code"].strip()
        email = serializer.validated_data.get("email")
        phone_number = serializer.validated_data.get("phone_number")
        if channel == VerificationCode.CHANNEL_EMAIL:
            destination = (email or "").strip().lower()
            lookup = {"email": destination}
        else:
            destination = (phone_number or "").strip()
            lookup = {"phone_number": destination}
        try:
            user = User.objects.get(**lookup)
        except User.DoesNotExist:
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
        cfg = get_verification_config()
        now = timezone.now()
        with transaction.atomic():
            code_obj = (
                VerificationCode.objects.select_for_update()
                .filter(
                    user=user,
                    channel=channel,
                    destination=destination,
                    used_at__isnull=True,
                    expires_at__gt=now,
                )
                .order_by("-created_at")
                .first()
            )
            if not code_obj:
                return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
            if code_obj.attempt_count >= cfg.max_attempts:
                return Response({"detail": "Too many attempts. Please request a new code."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            code_obj.attempt_count += 1
            code_obj.last_attempt_at = now
            if not code_obj.check_code(raw_code):
                code_obj.save(update_fields=["attempt_count", "last_attempt_at"])
                return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
            code_obj.used_at = now
            code_obj.save(update_fields=["attempt_count", "last_attempt_at", "used_at"])
            user.is_verified = True
            if channel == VerificationCode.CHANNEL_EMAIL:
                user.email_verified_at = now
                user.save(update_fields=["is_verified", "email_verified_at"])
            else:
                user.phone_verified_at = now
                user.save(update_fields=["is_verified", "phone_verified_at"])
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Verified successfully.",
                "verified": True,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

