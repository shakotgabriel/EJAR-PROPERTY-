from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
class Property(models.Model):
    PROPERTY_TYPE_CHOICES = (
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('condo', 'Condo'),
        ('townhouse', 'Townhouse'),
        ('studio', 'Studio'),
        ('room', 'Room'),
        ('commercial', 'Commercial'),
    )
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('rented', 'Rented'),
        ('pending', 'Pending'),
        ('maintenance', 'Under Maintenance'),
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_properties'
    )
    address = models.CharField(max_length=255, default="Unknown")
    location = models.CharField(max_length=100, blank=True, default="", help_text="Neighborhood or area (e.g., Jebel, Hai Al-Matar)")
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='USA')
    bedrooms = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    bathrooms = models.DecimalField(max_digits=4, decimal_places=1, validators=[MinValueValidator(0)])
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    parking_spaces = models.PositiveIntegerField(default=0)
    pets_allowed = models.BooleanField(default=False)
    furnished = models.BooleanField(default=False)
    utilities_included = models.BooleanField(default=False)
    lease_duration_months = models.PositiveIntegerField(default=12)
    available_from = models.DateField()
    views_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['city', 'status']),
            models.Index(fields=['property_type', 'status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['owner']),
        ]
    def __str__(self):
        return f"{self.title} - {self.city}"
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    @property
    def full_address(self):
        return f"{self.address}, {self.city}, {self.country}"
    @property
    def average_rating(self):
        return self.reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0
class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='property_images/')
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = 'Property Image'
        verbose_name_plural = 'Property Images'
        ordering = ['order', '-uploaded_at']
    def __str__(self):
        return f"Image for {self.property.title}"
    def save(self, *args, **kwargs):
        if self.is_primary:
            PropertyImage.objects.filter(property=self.property, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)
class PropertyAmenity(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or emoji")
    description = models.TextField(blank=True)
    class Meta:
        verbose_name = 'Property Amenity'
        verbose_name_plural = 'Property Amenities'
        ordering = ['name']
    def __str__(self):
        return self.name
class PropertyAmenityRelation(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='amenity_relations')
    amenity = models.ForeignKey(PropertyAmenity, on_delete=models.CASCADE)
    class Meta:
        unique_together = ['property', 'amenity']
        verbose_name = 'Property Amenity Relation'
        verbose_name_plural = 'Property Amenity Relations'
class PropertyFavorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorite_properties')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ['user', 'property']
        verbose_name = 'Property Favorite'
        verbose_name_plural = 'Property Favorites'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user']), models.Index(fields=['property'])]
    def __str__(self):
        return f"{self.user.email} favorited {self.property.title}"
class PropertyReview(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='property_reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200)
    comment = models.TextField()
    location_rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    value_rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    maintenance_rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        unique_together = ['property', 'reviewer']
        verbose_name = 'Property Review'
        verbose_name_plural = 'Property Reviews'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['property']), models.Index(fields=['reviewer'])]
    def __str__(self):
        return f"{self.reviewer.email} - {self.property.title} ({self.rating}★)"
class PropertyInquiry(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='inquiries')
    inquirer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='property_inquiries')
    message = models.TextField()
    phone_number = models.CharField(max_length=20, blank=True)
    preferred_move_in_date = models.DateField(null=True, blank=True)
    STATUS_CHOICES = (
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('scheduled', 'Viewing Scheduled'),
        ('closed', 'Closed'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = 'Property Inquiry'
        verbose_name_plural = 'Property Inquiries'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['property']), models.Index(fields=['inquirer']), models.Index(fields=['status'])]
    def __str__(self):
        return f"Inquiry from {self.inquirer.email} for {self.property.title}"

