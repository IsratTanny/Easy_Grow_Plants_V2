from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'phone', 'whatsapp_number', 'address', 'green_points', 'full_name', 'nid_number', 'bio', 'profile_picture', 'cover_photo', 'is_verified', 'nid_front', 'nid_back', 'date_joined']

    def is_valid(self, *, raise_exception=False):
        valid = super().is_valid(raise_exception=False)
        if not valid:
            print(f"Validation Erros: {self.errors}")
            print(f"Initial Data: {self.initial_data}")
        if raise_exception and not valid:
            raise serializers.ValidationError(self.errors)
        return valid

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class PublicUserSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    delivery_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'bio', 'profile_picture', 'cover_photo', 'phone', 'whatsapp_number', 'address', 'is_verified', 'green_points', 'avg_rating', 'review_count', 'delivery_count', 'date_joined')

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        res = obj.reviews_received.aggregate(Avg('rating'))['rating__avg']
        return round(res, 1) if res else 0

    def get_review_count(self, obj):
        return obj.reviews_received.count()

    def get_delivery_count(self, obj):
        from backend.apps.marketplace.models import OrderItem
        return OrderItem.objects.filter(plant__seller=obj, order__status__in=['delivered', 'completed']).count()

from .models import BotanistApplication

class BotanistApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BotanistApplication
        fields = '__all__'
