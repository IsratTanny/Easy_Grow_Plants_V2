from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Plant, Order, OrderItem, ShipFastRequest, 
    SellerPaymentMethod, PaymentRequest, Review,
    ExchangePost, ExchangeProposal, ExchangeProposalMessage,
    CartItem
)

class CartItemSerializer(serializers.ModelSerializer):
    plant_details = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'user', 'plant', 'quantity', 'plant_details', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_plant_details(self, obj):
        return {
            'id': obj.plant.id,
            'name': obj.plant.plant_name,
            'price': obj.plant.price,
            'image_url': obj.plant.image_url.url if obj.plant.image_url else None,
            'seller_username': obj.plant.seller.username
        }

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    plant_name = serializers.SerializerMethodField()
    plant_image = serializers.SerializerMethodField()

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else "Anonymous"

    def get_user_username(self, obj):
        return obj.user.username if obj.user else "anonymous"

    def get_user_avatar(self, obj):
        if obj.user and obj.user.profile_picture:
            return obj.user.profile_picture.url
        return None

    def get_plant_name(self, obj):
        return obj.plant.plant_name if obj.plant else "General Feedback"

    def get_plant_image(self, obj):
        if obj.plant and obj.plant.image_url:
            return obj.plant.image_url.url
        return None

    # Using lazy queryset evaluation for writes
    plant_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    seller_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'user_username', 'user_avatar', 
            'seller', 'plant', 'plant_name', 'plant_image',
            'rating', 'comment', 'image', 'created_at',
            'plant_id', 'seller_id'
        ]
        read_only_fields = ('user', 'created_at', 'seller', 'plant')

class CreateOrderSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField())
    customer_name = serializers.CharField(max_length=150)
    address = serializers.CharField()
    phone = serializers.CharField(max_length=20)
    location = serializers.CharField(max_length=20)
    delivery_charge = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    payment_method = serializers.CharField(max_length=20)

class PlantSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    seller_lat = serializers.DecimalField(source='seller.latitude', max_digits=9, decimal_places=6, read_only=True)
    seller_lon = serializers.DecimalField(source='seller.longitude', max_digits=9, decimal_places=6, read_only=True)
    
    class Meta:
        model = Plant
        fields = '__all__'
        read_only_fields = ('seller',)

class SellerSerializer(serializers.ModelSerializer):
    top_rated_plant = serializers.SerializerMethodField()
    
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'full_name', 'latitude', 'longitude', 'profile_picture', 'top_rated_plant']

    def get_top_rated_plant(self, obj):
        # Simplistic: get the plant with most stock or just first
        plant = Plant.objects.filter(seller=obj).first()
        return plant.plant_name if plant else "Various Plants"

class OrderItemSerializer(serializers.ModelSerializer):
    plant_details = PlantSerializer(source='plant', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'

    def get_items(self, obj):
        request = self.context.get('request')
        items = obj.items.all()
        if request and request.user.is_authenticated:
            # Check if requesting from admin dashboard
            referer = request.META.get('HTTP_REFERER', '')
            is_admin_dashboard = '/admin-dashboard' in referer
            
            # If Admin in Dashboard, they see ALL items
            if request.user.role == 'admin' and is_admin_dashboard:
                return OrderItemSerializer(items, many=True).data
                
            # If user is the buyer, they see all items
            if obj.user == request.user:
                return OrderItemSerializer(items, many=True).data
                
            # If user is a seller (and not the buyer), they only see items belonging to them
            if request.user.role in ['seller', 'admin']:
                seller_items = items.filter(plant__seller=request.user)
                return OrderItemSerializer(seller_items, many=True).data
        return []

class ShipFastRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipFastRequest
        fields = '__all__'

class SellerPaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerPaymentMethod
        fields = '__all__'

class PaymentRequestSerializer(serializers.ModelSerializer):
    payment_method_details = SellerPaymentMethodSerializer(source='payment_method', read_only=True)
    
    class Meta:
        model = PaymentRequest
        fields = '__all__'

class ExchangePostSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ExchangePost
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class ExchangeProposalSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    plant_details = ExchangePostSerializer(source='plant', read_only=True)
    
    class Meta:
        model = ExchangeProposal
        fields = '__all__'
        read_only_fields = ('sender', 'created_at')

class ExchangeProposalMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = ExchangeProposalMessage
        fields = '__all__'
        read_only_fields = ('sender', 'created_at')
