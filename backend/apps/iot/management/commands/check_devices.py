import requests
from django.core.management.base import BaseCommand
from django.utils import timezone
from backend.apps.iot.models import Device, DeviceReading
from backend.apps.plant_care.models import Notification
from datetime import datetime

class Command(BaseCommand):
    help = 'Check sensor readings for devices with scheduled check times and notify if below threshold'

    def handle(self, *args, **options):
        now = timezone.localtime().time()
        # Find devices whose schedule_time is close to now (within 5 minutes)
        # or just run for all devices if you want to poll continuously
        devices = Device.objects.filter(is_active=True, schedule_time__isnull=False)
        
        for device in devices:
            # Check if it's the right time AND we haven't checked today
            if (device.schedule_time.hour == now.hour and 
                device.schedule_time.minute == now.minute and
                device.last_scheduled_check != timezone.localdate()):
                
                self.stdout.write(f"Running scheduled check for {device.device_id}...")
                
                # Update the check date immediately to prevent race conditions or double runs
                device.last_scheduled_check = timezone.localdate()
                device.save()
                
                if not device.ip_address:
                    continue

                try:
                    # Poll the device
                    response = requests.get(f"http://{device.ip_address}/data", timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        moisture = data.get('percent', 0)
                        
                        # Save the reading
                        DeviceReading.objects.create(
                            device=device,
                            soil_moisture=moisture,
                            temperature=data.get('temp', 25),
                            water_level=data.get('water_level', 100)
                        )
                        
                        # Threshold check
                        if moisture < device.moisture_threshold:
                            msg = f"Plant '{device.plant_name or device.name}' is thirsty (Moisture: {moisture}%). Would you like to water it?"
                            Notification.objects.create(
                                user=device.owner,
                                message=msg
                            )
                            self.stdout.write(self.style.SUCCESS(f"Notification sent to {device.owner.username}"))
                    else:
                        self.stdout.write(self.style.WARNING(f"Device {device.device_id} returned {response.status_code}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Failed to check device {device.device_id}: {str(e)}"))
