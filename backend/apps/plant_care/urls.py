from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlantCategoryViewSet, PlantVarietyViewSet

router = DefaultRouter()
router.register(r'categories', PlantCategoryViewSet)
router.register(r'varieties', PlantVarietyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
