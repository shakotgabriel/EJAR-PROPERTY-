from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet, PropertyImageViewSet, PropertyAmenityViewSet,
    PropertyReviewViewSet, PropertyInquiryViewSet
)
router = DefaultRouter()
router.register(r'images', PropertyImageViewSet, basename='property-image')
router.register(r'amenities', PropertyAmenityViewSet, basename='property-amenity')
router.register(r'reviews', PropertyReviewViewSet, basename='property-review')
router.register(r'inquiries', PropertyInquiryViewSet, basename='property-inquiry')
router.register(r'', PropertyViewSet, basename='property')
app_name = 'properties'
urlpatterns = [
    path('', include(router.urls)),
]

