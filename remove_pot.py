import os
import django
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.iot.models import Device

device_id_to_remove = "POT_001"

# Search by device_id or name
devices = Device.objects.filter(device_id=device_id_to_remove) | Device.objects.filter(name=device_id_to_remove)

if devices.exists():
    for d in devices:
        print(f"Removing device: {d.name} (ID: {d.device_id}) owned by {d.owner.username}")
        d.delete()
    print("Removal successful.")
else:
    print(f"No device found with ID or Name: {device_id_to_remove}")

print("Current devices in system:")
for d in Device.objects.all():
    print(f"- {d.name} (ID: {d.device_id})")
