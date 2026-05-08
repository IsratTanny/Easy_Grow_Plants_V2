from django.core.management.base import BaseCommand
from django.utils import timezone
from backend.apps.iot.models import Device, DeviceReading, WateringLog
import requests
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Run scheduled automatic watering for all eligible IoT devices."

    def handle(self, *args, **options):
        now = timezone.now()
        today = timezone.localdate(now)
        current_time = timezone.localtime(now).time()

        devices = Device.objects.filter(is_active=True, auto_watering_enabled=True)
        
        for device in devices:
            if not device.schedule_time:
                continue
                
            # If already checked today, skip
            if device.last_scheduled_check == today:
                continue
                
            # Only run if current time is past the schedule_time
            if current_time >= device.schedule_time:
                self.stdout.write(f"Checking device {device.device_id}...")
                
                if not device.ip_address:
                    self.stdout.write(f"Device {device.device_id} has no IP address.")
                    # We mark as checked to avoid spamming errors all day
                    device.last_scheduled_check = today
                    device.save(update_fields=['last_scheduled_check'])
                    continue

                try:
                    # 1. Fetch current data
                    r = requests.get(f"http://{device.ip_address}/data", timeout=5)
                    r.raise_for_status()
                    data = r.json()
                    
                    # Update heartbeat
                    device.last_seen = now
                    device.save(update_fields=['last_seen'])
                    
                    # Save reading
                    moisture_percent = data.get('moisture', 0)
                    DeviceReading.objects.create(
                        device=device,
                        soil_moisture=moisture_percent,
                        soil_raw=data.get('soil_raw', 0),
                        temperature=data.get('temp', 0),
                        water_level=data.get('water_level', 0),
                        pump_status=data.get('pump_status', False)
                    )

                    # 2. Evaluate Hysteresis Logic
                    hysteresis_margin = 2
                    trigger_threshold = device.moisture_threshold - hysteresis_margin
                    
                    if moisture_percent <= trigger_threshold:
                        # 3. Trigger Watering
                        if device.last_auto_water_date == today:
                            self.stdout.write(f"Device {device.device_id} already auto-watered today. Skipping.")
                            device.last_scheduled_check = today
                            device.save(update_fields=['last_scheduled_check'])
                            continue
                            
                        duration = device.pump_duration_seconds
                        try:
                            rw = requests.get(f"http://{device.ip_address}/water?duration={duration}", timeout=5)
                            rw.raise_for_status()
                            
                            device.last_auto_water_date = today
                            device.last_watered_at = now
                            
                            WateringLog.objects.create(
                                device=device,
                                trigger_type='scheduled',
                                moisture_before=moisture_percent,
                                threshold=device.moisture_threshold,
                                duration_seconds=duration,
                                success=True,
                                response=f"HTTP {rw.status_code}"
                            )
                            self.stdout.write(self.style.SUCCESS(f"Successfully watered device {device.device_id} for {duration}s."))
                            
                        except Exception as e_water:
                            WateringLog.objects.create(
                                device=device, trigger_type='scheduled', moisture_before=moisture_percent,
                                threshold=device.moisture_threshold, duration_seconds=duration, success=False, response=str(e_water)[:250]
                            )
                            self.stdout.write(self.style.ERROR(f"Failed to water device {device.device_id}: {e_water}"))
                            
                    else:
                        self.stdout.write(f"Device {device.device_id} moisture ({moisture_percent}%) above trigger threshold ({trigger_threshold}%). No watering needed.")

                    # Mark check complete
                    device.last_scheduled_check = today
                    device.save(update_fields=['last_scheduled_check', 'last_auto_water_date', 'last_watered_at'])
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Failed to fetch data from device {device.device_id}: {e}"))
                    # If offline/error, do NOT update last_scheduled_check, but create failed WateringLog
                    WateringLog.objects.create(
                        device=device, trigger_type='scheduled', duration_seconds=device.pump_duration_seconds, success=False, response=f"Connection error: {str(e)[:200]}"
                    )
