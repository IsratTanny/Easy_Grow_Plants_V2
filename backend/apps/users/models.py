from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('seller', 'Seller'),
        ('buyer', 'Buyer'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='buyer')
    full_name = models.CharField(max_length=100, blank=True, null=True)
    nid_number = models.CharField(max_length=20, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    whatsapp_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    cover_photo = models.ImageField(upload_to='covers/', blank=True, null=True)
    green_points = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    nid_front = models.ImageField(upload_to='nids/', blank=True, null=True)
    nid_back = models.ImageField(upload_to='nids/', blank=True, null=True)
    face_captured = models.ImageField(upload_to='faces/', blank=True, null=True)
    is_seller = models.BooleanField(default=False)
    is_buyer = models.BooleanField(default=False)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def save(self, *args, **kwargs):
        # Sync flags with role
        self.is_seller = (self.role == 'seller')
        self.is_buyer = (self.role == 'buyer' or self.role == 'seller') # Sellers can usually buy too
        if self.role == 'admin':
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class BotanistApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    area = models.CharField(max_length=100)
    experience = models.CharField(max_length=50)
    specialty = models.CharField(max_length=100)
    nid_copy = models.ImageField(upload_to='botanist_docs/', blank=True, null=True)
    certificate = models.ImageField(upload_to='botanist_docs/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.specialty} ({self.status})"
