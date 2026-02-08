from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, UserViewSet,
    ChangePasswordView, PasswordResetRequestView,
    PasswordResetConfirmView, UserListView,
    VerificationStartView, VerificationConfirmView
)
router = DefaultRouter()
router.register(r'', UserViewSet, basename='users')
app_name = 'users'
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset-confirm/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('verify/start/', VerificationStartView.as_view(), name='verify_start'),
    path('verify/confirm/', VerificationConfirmView.as_view(), name='verify_confirm'),
    path('landlords/', UserListView.as_view(), {'role': 'landlord'}, name='landlords'),
    path('agents/', UserListView.as_view(), {'role': 'agent'}, name='agents'),
    path('', include(router.urls)),
]

