from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, permissions, filters
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import (
    Property, PropertyImage, PropertyAmenity, PropertyFavorite,
    PropertyReview, PropertyInquiry
)
from .filters import PropertyFilter
from .permissions import IsOwnerOrReadOnly, IsLandlordOrAgentOrReadOnly, IsInquiryParticipant, IsPropertyOwner, IsTenant
from .serializers import (
    PropertySerializer, PropertyImageSerializer, PropertyAmenitySerializer,
    PropertyFavoriteSerializer, PropertyReviewSerializer, PropertyInquirySerializer
)
class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    authentication_classes = (JWTAuthentication,)
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ['title', 'description', 'city', 'country']
    ordering_fields = ['created_at', 'rent_amount', 'bedrooms', 'bathrooms']
    ordering = ['-created_at']
    def get_queryset(self):
        queryset = Property.objects.all().prefetch_related('images', 'amenity_relations', 'favorited_by', 'reviews')
        mine = self.request.query_params.get("mine")
        if mine and self.request.user.is_authenticated:
            queryset = queryset.filter(owner=self.request.user)
        return queryset
    def get_permissions(self):
        if self.action in ["list", "retrieve", "filter_options"]:
            return [permissions.AllowAny()]
        if self.action == "create":
            return [IsLandlordOrAgentOrReadOnly()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        return [permissions.IsAuthenticatedOrReadOnly()]
    def perform_create(self, serializer):
        with transaction.atomic():
            prop = serializer.save(owner=self.request.user if self.request.user.is_authenticated else None)
            images = []
            if hasattr(self.request, "FILES"):
                images.extend(self.request.FILES.getlist("image"))
                images.extend(self.request.FILES.getlist("images"))
            for idx, img in enumerate(images):
                img_serializer = PropertyImageSerializer(
                    data={
                        "property": prop.id,
                        "image": img,
                        "order": idx,
                        "is_primary": idx == 0,
                    },
                    context=self.get_serializer_context(),
                )
                img_serializer.is_valid(raise_exception=True)
                img_serializer.save()
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def filter_options(self, request):
        """Return distinct cities and property types from the database."""
        cities = list(
            Property.objects.values_list('city', flat=True)
            .distinct()
            .order_by('city')
        )
        property_types = list(
            Property.objects.values_list('property_type', flat=True)
            .distinct()
            .order_by('property_type')
        )
        type_labels = dict(Property.PROPERTY_TYPE_CHOICES)
        property_types_with_labels = [
            {'value': pt, 'label': type_labels.get(pt, pt.title())}
            for pt in property_types
        ]
        return Response({
            'cities': [c for c in cities if c],
            'property_types': property_types_with_labels,
        })
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        property = self.get_object()
        favorite, created = PropertyFavorite.objects.get_or_create(user=request.user, property=property)
        if not created:
            favorite.delete()
            return Response({'status': 'removed from favorites'})
        return Response({'status': 'added to favorites'})
class PropertyImageViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyImageSerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    authentication_classes = (JWTAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    def get_queryset(self):
        queryset = PropertyImage.objects.all()
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        return queryset
    def perform_create(self, serializer):
        serializer.save()
class PropertyAmenityViewSet(viewsets.ModelViewSet):
    queryset = PropertyAmenity.objects.all()
    serializer_class = PropertyAmenitySerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
class PropertyFavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PropertyFavoriteSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    def get_queryset(self):
        return PropertyFavorite.objects.filter(user=self.request.user)
class PropertyReviewViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyReviewSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get_queryset(self):
        queryset = PropertyReview.objects.all()
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        return queryset
    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
class PropertyInquiryViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyInquirySerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsTenant()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsPropertyOwner()]
        return [permissions.IsAuthenticated(), IsInquiryParticipant()]
    def get_queryset(self):
        queryset = PropertyInquiry.objects.all()
        user = self.request.user
        if not user or not user.is_authenticated:
            return queryset.none()
        if user.is_staff:
            return queryset
        queryset = queryset.filter(Q(inquirer=user) | Q(property__owner=user))
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        return queryset
    def perform_create(self, serializer):
        serializer.save(inquirer=self.request.user)

