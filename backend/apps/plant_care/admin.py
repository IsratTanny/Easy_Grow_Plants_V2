from django.contrib import admin
from .models import PlantCategory, PlantVariety

@admin.register(PlantCategory)
class PlantCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'plant_type', 'care_type')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(PlantVariety)
class PlantVarietyAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'slug')
    list_filter = ('category', 'category__care_type')
    prepopulated_fields = {'slug': ('name',)}
