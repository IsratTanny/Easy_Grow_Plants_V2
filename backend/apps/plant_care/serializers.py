from rest_framework import serializers
from .models import PlantCategory, PlantVariety

class PlantVarietySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantVariety
        fields = ['id', 'name', 'description', 'care_instructions', 'image_url', 'category', 'created_at']

class PlantCategorySerializer(serializers.ModelSerializer):
    varieties = PlantVarietySerializer(many=True, read_only=True)

    class Meta:
        model = PlantCategory
        fields = ['id', 'name', 'image_url', 'varieties']
