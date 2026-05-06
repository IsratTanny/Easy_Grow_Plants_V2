from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from .models import Plant, Order, OrderItem, ShipFastRequest, SellerPaymentMethod, PaymentRequest
from .serializers import (
    PlantSerializer, OrderSerializer, CreateOrderSerializer, 
    ShipFastRequestSerializer, SellerPaymentMethodSerializer, PaymentRequestSerializer, ReviewSerializer,
    ExchangePostSerializer, ExchangeProposalSerializer, ExchangeProposalMessageSerializer, SellerSerializer,
    CartItemSerializer
)
from .models import ExchangePost, ExchangeProposal, ExchangeProposalMessage, CartItem

class CartItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user shopping cart items with strict isolation.
    """
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Strictly return data only for the logged-in user
        # Admin restriction: pull items belonging only to them
        return CartItem.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Explicitly assign user = request.user to prevent ID spoofing
        serializer.save(user=self.request.user)
@method_decorator(csrf_exempt, name='dispatch')
class SellerPaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = SellerPaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SellerPaymentMethod.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If is_default is true, unset other defaults
        if serializer.validated_data.get('is_default'):
            SellerPaymentMethod.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            SellerPaymentMethod.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save()

@method_decorator(csrf_exempt, name='dispatch')
class PaymentRequestViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentRequest.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class IsSellerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['seller', 'admin']

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user or request.user.role == 'admin'

@method_decorator(csrf_exempt, name='dispatch')
class PlantViewSet(viewsets.ModelViewSet):
    queryset = Plant.objects.all().order_by('-created_at')
    serializer_class = PlantSerializer
    permission_classes = [IsSellerOrReadOnly]

    def get_queryset(self):
        queryset = Plant.objects.all().order_by('-created_at')
        seller_username = self.request.query_params.get('seller')
        category = self.request.query_params.get('category')
        
        if seller_username:
            queryset = queryset.filter(seller__username=seller_username)
        if category and category != 'All':
            queryset = queryset.filter(category__iexact=category)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='my-plants')
    def my_plants(self, request):
        queryset = Plant.objects.filter(seller=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
            
        # Check if requesting from admin dashboard to allow management
        referer = self.request.META.get('HTTP_REFERER', '')
        is_admin_dashboard = '/admin-dashboard' in referer
        
        # Admin can see all orders in the management dashboard
        if user.role == 'admin' and is_admin_dashboard:
            return Order.objects.all().order_by('-created_at')
            
        # Baseline: User always sees their own purchases
        personal_orders = Q(user=user)
        
        # Sellers also see orders where they are the seller
        if user.role == 'seller':
            sales_orders = Q(items__plant__seller=user)
            return Order.objects.filter(personal_orders | sales_orders).distinct().order_by('-created_at')
            
        # Default: Show only personal orders (for Buyers and Admins in profile)
        return Order.objects.filter(personal_orders).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if serializer.is_valid():
            items_data = serializer.validated_data['items']
            total_price = 0
            
            # Extract new fields
            delivery_charge = serializer.validated_data.get('delivery_charge', 0)
            
            import random
            import string
            import datetime
            
            # Generate Tracking ID
            now_str = datetime.datetime.now().strftime("%y%m%d")
            rand_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
            new_tracking_id = f"EGP-{now_str}-{rand_str}"
            
            order = Order.objects.create(
                user=request.user, 
                total_bill=0,
                customer_name=serializer.validated_data.get('customer_name'),
                address=serializer.validated_data.get('address'),
                phone=serializer.validated_data.get('phone'),
                delivery_location=serializer.validated_data.get('location'),
                delivery_charge=delivery_charge,
                payment_method=serializer.validated_data.get('payment_method', 'cod'),
                payment_status='pending',
                tracking_id=new_tracking_id,
            )
            
            # Simulate sending details to courier mapping
            if order.delivery_location == 'inside_dhaka':
                order.courier_service = 'Pathao'
            else:
                order.courier_service = 'Steadfast'
            
            for item in items_data:
                plant_id = item.get('plant_id') or item.get('id')
                quantity = item.get('quantity', 1)
                try:
                    plant = Plant.objects.get(id=plant_id)
                    price = plant.price * quantity
                    total_price += price
                    OrderItem.objects.create(order=order, plant=plant, quantity=quantity, price=plant.price, buying_price=plant.buying_price)
                    # Update stock
                    plant.stock_quantity -= quantity
                    plant.save()
                except Plant.DoesNotExist:
                    continue
            
            order.total_bill = total_price + delivery_charge
            order.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def track(self, request):
        tracking_id = request.query_params.get('id')
        if not tracking_id:
            return Response({'error': 'Tracking ID required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Restricted tracking: only owner or seller can track, preventing ID leaks
            order = Order.objects.get(
                Q(tracking_id=tracking_id) & 
                (Q(user=request.user) | Q(items__plant__seller=request.user))
            )
            return Response({
                'tracking_id': order.tracking_id,
                'status': order.status,
                'courier_service': order.courier_service,
                'customer_name': order.customer_name or order.user.username,
                'delivery_location': order.delivery_location,
                'payment_method': order.payment_method,
                'payment_status': order.payment_status,
                'total_bill': order.total_bill,
                'created_at': order.created_at,
                'items': [{'name': item.plant.plant_name, 'quantity': item.quantity} for item in order.items.all()]
            }, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

@method_decorator(csrf_exempt, name='dispatch')
class ShipFastRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ShipFastRequestSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return ShipFastRequest.objects.filter(seller=self.request.user).order_by('-created_at')
        return ShipFastRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(role__in=['seller', 'admin']).first()
            print(f"DEBUG: Unauthenticated POST, using fallback user: {user.username if user else 'None'}")
        
        print(f"DEBUG: Creating request for user: {user.username if user else 'Anonymous'}")
        serializer.save(seller=user)

from .models import Review
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    def get_queryset(self):
        queryset = Review.objects.all().order_by('-created_at')
        seller_username = self.request.query_params.get('seller')
        plant_id = self.request.query_params.get('plant_id')
        if seller_username:
            queryset = queryset.filter(seller__username=seller_username)
        if plant_id:
            queryset = queryset.filter(plant_id=plant_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        plant_id = serializer.validated_data.pop('plant_id', None)
        seller_id = serializer.validated_data.pop('seller_id', None)
        
        review = serializer.save(user=user)
        
        if plant_id:
            try:
                plant = Plant.objects.get(id=plant_id)
                review.plant = plant
                # Also set the seller automatically from the plant
                review.seller = plant.seller
                review.save()
            except Plant.DoesNotExist:
                pass
        elif seller_id:
            try:
                from django.contrib.auth import get_user_model
                Seller = get_user_model()
                seller = Seller.objects.get(id=seller_id)
                review.seller = seller
                review.save()
            except Seller.DoesNotExist:
                pass

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        # Author can delete, Admin can delete, or Seller of the product can delete
        is_seller = review.seller == request.user
        if request.user.role == 'admin' or request.user == review.user or is_seller:
            return super().destroy(request, *args, **kwargs)
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You do not have permission to delete this review.")

class ExchangePostViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangePostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = ExchangePost.objects.all().order_by('-created_at')
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_available=True, status='available')

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if request.user == post.user or request.user.role == 'admin':
            return super().destroy(request, *args, **kwargs)
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You do not have permission to delete this exchange post.")

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_exchanged(self, request, pk=None):
        post = self.get_object()
        if request.user != post.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only mark your own posts as exchanged.")
        post.is_available = False
        post.status = 'done'
        post.save()
        return Response({"status": "post marked as exchanged"})

@method_decorator(csrf_exempt, name='dispatch')
class ExchangeProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangeProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Strict privacy restriction: Only original sender or active receiver (post creator) can fetch messages.
        return ExchangeProposal.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        proposal = self.get_object()
        if proposal.receiver != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only accept proposals for your own posts.")
        
        proposal.status = 'accepted'
        proposal.save()
        
        # Optionally, reject all other proposals for this post
        ExchangeProposal.objects.filter(post=proposal.post).exclude(id=proposal.id).update(status='rejected')
        
        return Response({'status': 'Exchange proposal accepted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        proposal = self.get_object()
        if proposal.receiver != request.user and proposal.sender != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only mark exchanges for your own proposals as completed.")
        
        proposal.status = 'accepted'
        proposal.save()
        
        # Update the plant status
        plant = proposal.plant
        plant.is_available = False
        plant.status = 'done'
        plant.save()
        return Response({'status': 'completed'})

    def reject(self, request, pk=None):
        proposal = self.get_object()
        if proposal.receiver != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only reject proposals for your own posts.")
        
        proposal.status = 'rejected'
        proposal.save()
        
        return Response({'status': 'Exchange proposal rejected'}, status=status.HTTP_200_OK)

class ExchangeProposalMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangeProposalMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        proposal_id = self.request.query_params.get('proposal_id')
        queryset = ExchangeProposalMessage.objects.filter(
            Q(proposal__sender=user) | Q(proposal__receiver=user)
        ).order_by('created_at')
        if proposal_id:
            queryset = queryset.filter(proposal_id=proposal_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
class SellerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SellerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Only return users with role 'seller' and who have coordinates set
        return User.objects.filter(role='seller', latitude__isnull=False, longitude__isnull=False)

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        max_distance = request.query_params.get('distance', 50) # Default 50km

        if not lat or not lon:
            return Response({'error': 'Latitude and Longitude required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(lat)
            lon = float(lon)
            max_distance = float(max_distance)
        except ValueError:
            return Response({'error': 'Invalid coordinates or distance'}, status=status.HTTP_400_BAD_REQUEST)

        from math import radians, cos, sin, asin, sqrt

        def haversine(lon1, lat1, lon2, lat2):
            # convert decimal degrees to radians 
            lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
            # haversine formula 
            dlon = lon2 - lon1 
            dlat = lat2 - lat1 
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a)) 
            r = 6371 # Radius of earth in kilometers. Use 3956 for miles
            return c * r

        sellers = self.get_queryset()
        nearby_sellers = []
        for seller in sellers:
            distance = haversine(lon, lat, float(seller.longitude), float(seller.latitude))
            if distance <= max_distance:
                data = SellerSerializer(seller).data
                data['distance'] = round(distance, 2)
                nearby_sellers.append(data)

        # Sort by distance
        nearby_sellers.sort(key=lambda x: x['distance'])
        return Response(nearby_sellers)
