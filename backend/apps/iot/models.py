from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Device(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devices')
    device_id = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    name = models.CharField(max_length=100, default="My Device")
    plant_name = models.CharField(max_length=150, blank=True, default='')
    nickname = models.CharField(max_length=100, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="Local IP of the Arduino/ESP32 device")
    
    # Scheduling and Auto-Watering configurations
    moisture_threshold = models.IntegerField(
        default=30, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Alert when moisture% falls below this value"
    )
    auto_watering_enabled = models.BooleanField(default=False, help_text="Allow system to water automatically")
    pump_duration_seconds = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Seconds to run pump per watering event"
    )
    schedule_time = models.TimeField(null=True, blank=True, help_text="Daily time to check sensor readings")
    
    # State tracking
    last_scheduled_check = models.DateField(null=True, blank=True, help_text="Last date a scheduled check was successfully performed")
    last_auto_water_date = models.DateField(null=True, blank=True, help_text="Last date auto-watering actually triggered")
    last_watered_at = models.DateTimeField(null=True, blank=True, help_text="Last time pump was run (manual or auto)")
    last_seen = models.DateTimeField(null=True, blank=True, help_text="Last heartbeat or successful communication")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.plant_name or self.name} ({self.device_id})"

    @property
    def is_online(self):
        if not self.last_seen:
            return False
        # Consider online if seen within last 120 seconds
        return (timezone.now() - self.last_seen).total_seconds() <= 120

class DeviceReading(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='readings')
    soil_moisture = models.FloatField(help_text="Calculated percentage")
    soil_raw = models.IntegerField(default=0, help_text="Raw analog value from sensor")
    temperature = models.FloatField()
    water_level = models.FloatField()
    pump_status = models.BooleanField(default=False, help_text="True if pump was ON during reading")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reading for {self.device.device_id} at {self.timestamp}"

class WateringLog(models.Model):
    TRIGGER_CHOICES = (
        ('scheduled', 'Scheduled Auto'),
        ('manual', 'Manual User Trigger'),
    )
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='watering_logs')
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_CHOICES)
    moisture_before = models.FloatField(null=True, blank=True)
    threshold = models.FloatField(null=True, blank=True)
    duration_seconds = models.IntegerField()
    success = models.BooleanField(default=False)
    response = models.CharField(max_length=255, blank=True, null=True, help_text="Response from device or error message")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trigger_type} watering for {self.device.device_id} at {self.timestamp}"

class ChatLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_logs')
    message = models.TextField()
    bot_response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat by {self.user.username} at {self.timestamp}"
