from django.contrib import admin
from django.urls import path, include, re_path
from django.shortcuts import render
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
import os

from backend.apps.users.views import (
    RegisterView, UserDetailView, SellerProfileView, FaceVerificationView, AdminSellersView,
    BotanistApplicationListCreateView, BotanistApplicationActionView,
    login_view, register_view, dashboard_view
)
from backend.apps.marketplace.views import (
    PlantViewSet, OrderViewSet, ShipFastRequestViewSet, 
    SellerPaymentMethodViewSet, PaymentRequestViewSet, ReviewViewSet,
    ExchangePostViewSet, ExchangeProposalViewSet, ExchangeProposalMessageViewSet, SellerViewSet,
    CartItemViewSet
)
from backend.apps.iot.views import DeviceViewSet, ChatLogViewSet, ChatViewSet, DiagnosisViewSet

# API Router
router = DefaultRouter()
router.register(r'plants', PlantViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'shipfast-requests', ShipFastRequestViewSet, basename='shipfast-requests')
router.register(r'seller-payment-methods', SellerPaymentMethodViewSet, basename='seller-payment-methods')
router.register(r'payment-requests', PaymentRequestViewSet, basename='payment-requests')
router.register(r'reviews', ReviewViewSet, basename='reviews')
router.register(r'exchange-posts', ExchangePostViewSet, basename='exchange-posts')
router.register(r'exchange-proposals', ExchangeProposalViewSet, basename='exchange-proposals')
router.register(r'exchange-messages', ExchangeProposalMessageViewSet, basename='exchange-messages')
router.register(r'sellers-location', SellerViewSet, basename='sellers-location')
router.register(r'cart-items', CartItemViewSet, basename='cart-item')

# IoT Routes
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'chat-logs', ChatLogViewSet, basename='chatlog')
router.register(r'iot/chat', ChatViewSet, basename='iot-chat')
router.register(r'iot/diagnose', DiagnosisViewSet, basename='iot-diagnose')

# React app view - serves the index.html from frontend/dist
def react_app_view(request, *args, **kwargs):
    """
    Serve the React app's index.html file
    This catches all routes and lets React Router handle the routing
    """
    # Unmatched API/media requests must not fall through to the SPA HTML
    # (which would return a misleading 200). Return a real JSON 404 instead.
    if request.path.startswith(('/api/', '/media/')):
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Not found.'}, status=404)
    try:
        # Path to the built frontend index.html
        index_path = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
        
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read(), content_type='text/html')
        else:
            return HttpResponse(
                '<h1>Frontend not built</h1>'
                '<p>Please build the frontend first:</p>'
                '<ol>'
                '<li>cd frontend</li>'
                '<li>npm install</li>'
                '<li>npm run build</li>'
                '</ol>',
                content_type='text/html',
                status=503
            )
    except Exception as e:
        return HttpResponse(f'Error loading React app: {str(e)}', status=500)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API - Specific Apps
    path('api/plant-care/', include('backend.apps.plant_care.urls')),
    
    # Auth API
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', UserDetailView.as_view(), name='auth_me'),
    path('api/users/verify-face/', FaceVerificationView.as_view(), name='verify_face'),
    path('api/sellers/<str:username>/', SellerProfileView.as_view(), name='seller_profile'),
    path('api/admin/sellers/', AdminSellersView.as_view(), name='admin_sellers'),
    path('api/botanist-applications/', BotanistApplicationListCreateView.as_view(), name='botanist_apps'),
    path('api/botanist-applications/<int:pk>/<str:action>/', BotanistApplicationActionView.as_view(), name='botanist_app_action'),

    # API - General Router (Marketplace, IoT)
    path('api/', include(router.urls)),
    
    # Support API
    path('api/support/', include('backend.apps.support.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve the frontend/public/images directory at /images/
    urlpatterns += static('/images/', document_root=settings.BASE_DIR.parent / 'frontend' / 'public' / 'images')

# Catch-all pattern to serve React app
# This should be LAST so it doesn't override API routes
urlpatterns += [
    re_path(r'^.*$', react_app_view, name='react_app'),
]

