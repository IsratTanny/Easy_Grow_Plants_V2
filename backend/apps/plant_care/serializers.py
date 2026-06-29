from rest_framework import serializers
from .models import PlantCategory, PlantVariety, Subscription, Notification

class PlantVarietySerializer(serializers.ModelSerializer):
    care = serializers.SerializerMethodField()

    class Meta:
        model = PlantVariety
        fields = ['id', 'name', 'slug', 'description', 'image_url', 'care', 'created_at']

    def get_care(self, obj):
        return obj.get_care()

class PlantCategorySerializer(serializers.ModelSerializer):
    varieties = PlantVarietySerializer(many=True, read_only=True)

    class Meta:
        model = PlantCategory
        fields = ['id', 'name', 'slug', 'plant_type', 'care_type', 'image_url', 'varieties', 
                  'water_care', 'light_care', 'soil_care', 'toxicity_care']

class SubscriptionSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_address = serializers.CharField(source='user.address', read_only=True)

    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ['user', 'start_date', 'next_delivery_date', 'payment_status', 'is_active']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

from .models import DynamicCareCard, CareTemplate

class DynamicCareCardSerializer(serializers.ModelSerializer):
    template = serializers.SerializerMethodField()

    class Meta:
        model = DynamicCareCard
        fields = '__all__'

    def get_template(self, obj):
        template = CareTemplate.objects.filter(category=obj.category).first()
        if template:
            return {
                'watering_interval_days': template.watering_interval_days,
                'fertilizer_interval_days': template.fertilizer_interval_days,
                'repotting_interval_months': template.repotting_interval_months
            }
        # Fallbacks for unknown categories
        return {
            'watering_interval_days': 7,
            'fertilizer_interval_days': 30,
            'repotting_interval_months': 12
        }
from .models import Post, Comment

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'username', 'post', 'text', 'is_top_tip', 'created_at']
        read_only_fields = ['user', 'post', 'is_top_tip', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'user', 'username', 'image_base64', 'plant_name', 'caption', 'likes_count', 'is_liked_by_user', 'comments', 'created_at']
        read_only_fields = ['user', 'likes_count', 'created_at']

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False


from .models import BotanistAppointment, PottingRequest


class BotanistAppointmentSerializer(serializers.ModelSerializer):
    has_prescription = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = BotanistAppointment
        fields = '__all__'
        read_only_fields = (
            'user', 'assigned_botanist', 'status', 'base_fee', 'distance_charge',
            'total_fee', 'prescription_notes', 'created_at',
        )

    def get_has_prescription(self, obj):
        return bool(obj.prescription_notes)


class PottingRequestSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = PottingRequest
        fields = '__all__'
        read_only_fields = (
            'user', 'status', 'assigned_expert', 'service_fee', 'travel_charge',
            'total_bill', 'pot_count', 'pots_summary', 'created_at',
        )
