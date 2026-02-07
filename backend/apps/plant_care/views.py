from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import PlantCategory, PlantVariety
from .serializers import PlantCategorySerializer, PlantVarietySerializer

class PlantCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlantCategory.objects.all()
    serializer_class = PlantCategorySerializer
    permission_classes = [AllowAny] # Publicly accessible

class PlantVarietyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlantVariety.objects.all()
    serializer_class = PlantVarietySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = PlantVariety.objects.all()
        category_id = self.request.query_params.get('category', None)
        if category_id is not None:
            queryset = queryset.filter(category_id=category_id)
        return queryset
