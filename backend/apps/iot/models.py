from django.db import models
from django.conf import settings

class Device(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devices')
    device_id = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    name = models.CharField(max_length=100, default="My Device")
    plant_name = models.CharField(max_length=150, blank=True, default='')
    nickname = models.CharField(max_length=100, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="Local IP of the Arduino/ESP32 device")
    moisture_threshold = models.IntegerField(default=30, help_text="Alert when moisture% falls below this value")
    schedule_time = models.TimeField(null=True, blank=True, help_text="Daily time to check sensor readings")
    last_scheduled_check = models.DateField(null=True, blank=True, help_text="Last date a scheduled check was performed")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.plant_name or self.name} ({self.device_id})"

class DeviceReading(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='readings')
    soil_moisture = models.FloatField()
    temperature = models.FloatField()
    water_level = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reading for {self.device.device_id} at {self.timestamp}"

class ChatLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_logs')
    message = models.TextField()
    bot_response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat by {self.user.username} at {self.timestamp}"
