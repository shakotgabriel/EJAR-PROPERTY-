import django_filters
from .models import Property
class PropertyFilter(django_filters.FilterSet):
    """
    Advanced filter for Property model.
    Supports filtering by various criteria for search functionality.
    """
    min_rent = django_filters.NumberFilter(field_name='rent_amount', lookup_expr='gte')
    max_rent = django_filters.NumberFilter(field_name='rent_amount', lookup_expr='lte')
    min_bedrooms = django_filters.NumberFilter(field_name='bedrooms', lookup_expr='gte')
    max_bedrooms = django_filters.NumberFilter(field_name='bedrooms', lookup_expr='lte')
    bathrooms = django_filters.NumberFilter(field_name='bathrooms', lookup_expr='exact')
    min_bathrooms = django_filters.NumberFilter(field_name='bathrooms', lookup_expr='gte')
    max_bathrooms = django_filters.NumberFilter(field_name='bathrooms', lookup_expr='lte')
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    property_type = django_filters.MultipleChoiceFilter(
        field_name='property_type',
        choices=Property.PROPERTY_TYPE_CHOICES
    )
    status = django_filters.MultipleChoiceFilter(
        field_name='status',
        choices=Property.STATUS_CHOICES
    )
    pets_allowed = django_filters.BooleanFilter(field_name='pets_allowed')
    furnished = django_filters.BooleanFilter(field_name='furnished')
    utilities_included = django_filters.BooleanFilter(field_name='utilities_included')
    min_parking = django_filters.NumberFilter(field_name='parking_spaces', lookup_expr='gte')
    available_from = django_filters.DateFilter(field_name='available_from', lookup_expr='lte')
    owner_id = django_filters.NumberFilter(field_name='owner__id')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    class Meta:
        model = Property
        fields = [
            'property_type', 'status', 'city', 'country',
            'pets_allowed', 'furnished', 'utilities_included'
        ]

