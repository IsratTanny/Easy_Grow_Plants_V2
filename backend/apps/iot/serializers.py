from rest_framework import serializers
from .models import Device, DeviceReading, WateringLog, ChatLog

class DeviceSerializer(serializers.ModelSerializer):
    is_online = serializers.ReadOnlyField()
    latest_reading = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = '__all__'
        read_only_fields = ('owner', 'last_seen', 'last_scheduled_check', 'last_auto_water_date', 'last_watered_at')

    def get_latest_reading(self, obj):
        reading = obj.readings.order_by('-timestamp').first()
        if reading:
            return DeviceReadingSerializer(reading).data
        return None

class DeviceReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceReading
        fields = '__all__'

class WateringLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WateringLog
        fields = '__all__'

class ChatLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatLog
        fields = '__all__'
        read_only_fields = ('user',)
