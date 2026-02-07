from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render
from django.contrib.auth import logout
from django.shortcuts import redirect
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from backend.apps.users.views import (
    RegisterView, UserDetailView, 
    login_view, register_view, dashboard_view
)
from backend.apps.marketplace.views import PlantViewSet, OrderViewSet
from backend.apps.iot.views import DeviceViewSet, ChatLogViewSet

# API Router
router = DefaultRouter()
router.register(r'plants', PlantViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'chat-logs', ChatLogViewSet, basename='chatlog')

# Home view with statistics
def home_view(request):
    """Homepage with platform statistics"""
    from backend.apps.marketplace.models import Plant
    from backend.apps.iot.models import Device
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    context = {
        'total_plants': Plant.objects.count(),
        'total_users': User.objects.count(),
        'total_devices': Device.objects.count(),
    }
    return render(request, 'home.html', context)

# Marketplace view
def marketplace_view(request):
    """Marketplace page showing all plants"""
    from backend.apps.marketplace.models import Plant
    
    plants = Plant.objects.filter(stock__gt=0).order_by('-created_at')[:12]
    context = {
        'plants': plants
    }
    return render(request, 'marketplace.html', context)

# Logout view
def logout_view(request):
    """Logout user and redirect to home"""
    logout(request)
    return redirect('/')

urlpatterns = [
    # HTML Pages
    path('', home_view, name='home'),
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('marketplace/', marketplace_view, name='marketplace'),
    path('logout/', logout_view, name='logout'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API
    path('api/', include(router.urls)),
    path('api/plant-care/', include('backend.apps.plant_care.urls')),
    
    # Auth API
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', UserDetailView.as_view(), name='auth_me'),
]
