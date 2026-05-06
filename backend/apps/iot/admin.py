from django.contrib import admin
from .models import Device, DeviceReading, ChatLog

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'plant_name', 'device_id', 'owner', 'ip_address', 'is_active')
    search_fields = ('device_id', 'name', 'plant_name', 'owner__username')
    list_filter = ('is_active', 'owner')

@admin.register(DeviceReading)
class DeviceReadingAdmin(admin.ModelAdmin):
    list_display = ('device', 'soil_moisture', 'temperature', 'water_level', 'timestamp')
    list_filter = ('device', 'timestamp')

@admin.register(ChatLog)
class ChatLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'timestamp')
    list_filter = ('user', 'timestamp')
