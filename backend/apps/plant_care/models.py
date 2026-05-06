from django.db import models
from django.conf import settings

class PlantCategory(models.Model):
    CARE_TYPE_CHOICES = [
        ('general', 'General Care (Applies to all varieties)'),
        ('specific', 'Variety Specific (Care differs by variety)'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, null=True, blank=True, help_text="Unique identifier for URL routing")
    plant_type = models.CharField(max_length=100, blank=True, help_text="e.g. Vining, Succulent, Herbaceous")
    care_type = models.CharField(max_length=20, choices=CARE_TYPE_CHOICES, default='general')
    
    # General Care Fields (used if care_type is 'general')
    water_care = models.TextField(blank=True, help_text="General watering instructions")
    light_care = models.TextField(blank=True, help_text="General light requirements")
    soil_care = models.TextField(blank=True, help_text="General soil preferences")
    toxicity_care = models.TextField(blank=True, help_text="General toxicity information")
    
    image_url = models.URLField(blank=True, null=True, help_text="URL for category cover image")

    class Meta:
        verbose_name_plural = "Plant Categories"

    def __str__(self):
        return self.name

class PlantVariety(models.Model):
    category = models.ForeignKey(PlantCategory, related_name='varieties', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    variety_group = models.CharField(max_length=50, blank=True, help_text="e.g. Standard, Designer, Unique")
    
    # Variety Specific Care (used if category.care_type is 'specific' or overrides are needed)
    water_care = models.TextField(blank=True, help_text="Specific watering instructions")
    light_care = models.TextField(blank=True, help_text="Specific light requirements")
    soil_care = models.TextField(blank=True, help_text="Specific soil preferences")
    toxicity_care = models.TextField(blank=True, help_text="Specific toxicity information")
    
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Plant Varieties"

    def __str__(self):
        return self.name

    def get_care(self):
        """
        Returns the appropriate care instructions.
        Prioritizes specific variety care if present, otherwise falls back to category care.
        """
        return {
            'water': self.water_care or self.category.water_care,
            'light': self.light_care or self.category.light_care,
            'soil': self.soil_care or self.category.soil_care,
            'toxicity': self.toxicity_care or self.category.toxicity_care,
        }

class Subscription(models.Model):
    PLAN_CHOICES = [
        ('annual_green', 'Annual Green Care'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions', null=True, blank=True)
    plan_type = models.TextField()
    start_date = models.DateTimeField(auto_now_add=True)
    next_delivery_date = models.DateTimeField()
    payment_status = models.CharField(max_length=20, default='pending') # pending, paid
    is_active = models.BooleanField(default=False)
    
    # Guest & Shipping Info
    customer_name = models.CharField(max_length=150, blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    
    # Subscription Management
    status = models.CharField(max_length=20, default='active') # active, pending, expired, completed
    deliveries_completed = models.IntegerField(default=0)
    history = models.JSONField(default=list, blank=True)

    def __str__(self):
        user_disp = self.user.username if self.user else self.customer_name
        return f"{user_disp} - {self.plan_type}"

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}"

class CareTemplate(models.Model):
    category = models.CharField(max_length=100, unique=True, help_text="e.g. Pothos, Succulent, Cactus")
    watering_interval_days = models.IntegerField(default=7)
    fertilizer_interval_days = models.IntegerField(default=30)
    fertilizer_type = models.CharField(max_length=100, default="Organic Fertilizer", help_text="e.g. NPK, Organic, Liquid Fertilizer")

    repotting_interval_months = models.IntegerField(default=12)

    def __str__(self):
        return f"{self.category} Care Template"

class DynamicCareCard(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='care_cards')
    plant_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True)
    last_watered_date = models.DateField(auto_now_add=True)
    last_fertilized_date = models.DateField(auto_now_add=True)
    last_repotting_date = models.DateField(auto_now_add=True)
    watering_frequency = models.IntegerField(default=7, help_text="Days between watering")
    fertilizer_frequency = models.IntegerField(default=30, help_text="Days between fertilizing")
    source_order_id = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.plant_name} care card for {self.user.username}"

class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    image_base64 = models.TextField(blank=True, null=True, help_text='Base64 encoded plant image')
    plant_name = models.CharField(max_length=150, blank=True)
    caption = models.TextField(blank=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.user.username} - {self.plant_name}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    is_top_tip = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.id}"
