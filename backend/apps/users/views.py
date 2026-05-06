from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login
from django.contrib import messages
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import UserSerializer, PublicUserSerializer, BotanistApplicationSerializer
from .models import BotanistApplication
from django.contrib.auth import get_user_model
import os

# Optional imports to prevent server crash
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("WARNING: opencv-python not installed. Face verification will use demo fallback.")

User = get_user_model()

# Attempt to import face_recognition
try:
    import face_recognition
    FACE_REC_AVAILABLE = True
except ImportError:
    FACE_REC_AVAILABLE = False

class FaceVerificationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        face_image = request.FILES.get('face_image')
        nid_front = request.FILES.get('nid_front')
        nid_back = request.FILES.get('nid_back')
        is_frontend_verified = request.data.get('is_verified') == 'true'

        user = request.user
        if face_image:
            user.face_captured = face_image
        if nid_front:
            user.nid_front = nid_front
        if nid_back:
            user.nid_back = nid_back
        
        if is_frontend_verified:
            user.is_verified = True
        
        user.save()

        return Response({
            'success': True,
            'is_verified': user.is_verified,
            'message': 'NID data saved successfully.'
        })

# API Views
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        # Explicitly support PATCH for multipart file uploads
        return self.partial_update(request, *args, **kwargs)

class SellerProfileView(generics.RetrieveAPIView):
    queryset = User.objects.filter(role='seller')
    permission_classes = (permissions.AllowAny,)
    serializer_class = PublicUserSerializer
    lookup_field = 'username'

class AdminSellersView(generics.ListAPIView):
    queryset = User.objects.filter(role='seller')
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return User.objects.filter(role='seller')
        return User.objects.none()

class BotanistApplicationListCreateView(generics.ListCreateAPIView):
    queryset = BotanistApplication.objects.all()
    serializer_class = BotanistApplicationSerializer
    permission_classes = (permissions.AllowAny,)
    parser_classes = (MultiPartParser, FormParser)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

class BotanistApplicationActionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, pk, action):
        try:
            app = BotanistApplication.objects.get(pk=pk)
            if action == 'approve':
                app.status = 'approved'
                # Find the user by phone and verify them
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    # Use filter().first() instead of get() to handle multiple users with same phone
                    user = User.objects.filter(phone=app.phone).first()
                    if user:
                        user.is_verified = True
                        user.save()
                        
                        # Send Automated Notification
                        try:
                            from backend.apps.plant_care.models import Notification
                            Notification.objects.create(
                                user=user,
                                message=f"Your application to join as an Expert Botanist has been Approved. Congratulations {app.name}!"
                            )
                        except Exception as notify_err:
                            print(f"Notification error: {notify_err}")
                    else:
                        print(f"No user found with phone {app.phone}")
                except User.DoesNotExist:
                    print(f"User with phone {app.phone} not found for verification.")
            
            elif action == 'reject':
                app.status = 'rejected'
                # Send Rejection Notification if user exists
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    user = User.objects.filter(phone=app.phone).first()
                    if user:
                        try:
                            from backend.apps.plant_care.models import Notification
                            Notification.objects.create(
                                user=user,
                                message=f"Your application to join as an Expert Botanist has been Rejected."
                            )
                        except Exception as notify_err:
                            print(f"Notification error: {notify_err}")
                except Exception as e:
                    print(f"Error in rejection: {e}")
            
            app.save()
            return Response({'success': True, 'message': f'Botanist {action.capitalize()}ed Successfully'})
        except BotanistApplication.DoesNotExist:
            return Response({'error': 'Application not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# HTML Views
def login_view(request):
    """HTML login page"""
    # Redirect if already logged in
    if request.user.is_authenticated:
        return redirect('/dashboard/')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            # Redirect to next page or dashboard
            next_url = request.GET.get('next', '/dashboard/')
            return redirect(next_url)
        else:
            return render(request, 'login.html', {'error': 'Invalid username or password'})
    
    return render(request, 'login.html')


def register_view(request):
    """HTML registration page"""
    # Redirect if already logged in
    if request.user.is_authenticated:
        return redirect('/dashboard/')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        role = request.POST.get('role', 'buyer')
        phone = request.POST.get('phone', '')
        address = request.POST.get('address', '')
        
        # Validation
        if not username or not email or not password:
            return render(request, 'register.html', {'error': 'All required fields must be filled'})
        
        if password != password2:
            return render(request, 'register.html', {'error': 'Passwords do not match'})
        
        if len(password) < 8:
            return render(request, 'register.html', {'error': 'Password must be at least 8 characters long'})
        
        if User.objects.filter(username=username).exists():
            return render(request, 'register.html', {'error': 'Username already exists'})
        
        if User.objects.filter(email=email).exists():
            return render(request, 'register.html', {'error': 'Email already registered'})
        
        # Create user
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role,
                phone=phone,
                address=address,
                green_points=10  # Welcome bonus
            )
            return render(request, 'register.html', {
                'success': 'Account created successfully! You received 10 welcome Green Points.'
            })
        except Exception as e:
            return render(request, 'register.html', {'error': f'Registration failed: {str(e)}'})
    
    return render(request, 'register.html')


def dashboard_view(request):
    """Enhanced dashboard with statistics"""
    if not request.user.is_authenticated:
        return redirect('/login/?next=/dashboard/')
    
    # Import models here to avoid circular imports
    from backend.apps.marketplace.models import Plant, Order
    from backend.apps.iot.models import Device
    
    # Get user statistics
    context = {
        'user': request.user,
        'user_plants_count': Plant.objects.filter(seller=request.user).count() if request.user.role == 'seller' else 0,
        'user_orders_count': Order.objects.filter(user=request.user).count(),
        'user_devices_count': Device.objects.filter(owner=request.user).count(),
    }
    
    return render(request, 'dashboard.html', context)
