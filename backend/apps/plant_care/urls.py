from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlantCategoryViewSet, PlantVarietyViewSet, SubscriptionViewSet, NotificationViewSet,
    DynamicCareCardViewSet, PostViewSet, BotanistAppointmentViewSet, PottingRequestViewSet,
)
from .detection import PlantDetectionView, PlantChatView

router = DefaultRouter()
router.register(r'categories', PlantCategoryViewSet)
router.register(r'varieties', PlantVarietyViewSet)
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'care-cards', DynamicCareCardViewSet, basename='care-card')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'appointments', BotanistAppointmentViewSet, basename='appointment')
router.register(r'potting-requests', PottingRequestViewSet, basename='potting-request')

urlpatterns = [
    path('detect/', PlantDetectionView.as_view(), name='plant-detect'),
    path('chat/', PlantChatView.as_view(), name='plant-chat'),
    path('water-plant/<int:pk>/', DynamicCareCardViewSet.as_view({'post': 'mark_watered'})),
    path('fertilize-plant/<int:pk>/', DynamicCareCardViewSet.as_view({'post': 'mark_fertilized'})),
    path('', include(router.urls)),
]
