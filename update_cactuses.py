import os
import sys
import django
import shutil
import urllib.request
from pathlib import Path

project_root = str(Path(__file__).resolve().parent)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant
from django.core.files.base import ContentFile

# 1. Update Moon Cactus Pink with the generated image
generated_moon_cactus = r"C:\Users\User\.gemini\antigravity\brain\ad736586-abcc-4021-9a95-4db8f5aaefc5\moon_cactus_pink_1776662252904.png"
if os.path.exists(generated_moon_cactus):
    shutil.copy(generated_moon_cactus, os.path.join(project_root, 'media', 'plants', 'moon_cactus_pink.png'))
    p_moon = Plant.objects.get(plant_name="Moon Cactus Pink")
    p_moon.image_url = 'plants/moon_cactus_pink.png'
    p_moon.save()
    print("Updated Moon Cactus Pink!")
else:
    print("Could not find generated moon cactus image.")

# 2. Download and update Golden Barrel Cactus
golden_barrel_url = "https://upload.wikimedia.org/wikipedia/commons/3/39/Asiento_de_suegra_%28Echinocactus_grusonii%29%2C_Jard%C3%ADn_Bot%C3%A1nico%2C_M%C3%BAnich%2C_Alemania%2C_2013-09-08%2C_DD_02.JPG"
print("Downloading Golden Barrel Cactus...")
req = urllib.request.Request(golden_barrel_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
img_data = urllib.request.urlopen(req).read()

p_golden = Plant.objects.get(plant_name="Golden Barrel Cactus")
p_golden.image_url.save('golden_barrel_cactus.jpg', ContentFile(img_data), save=True)
print("Updated Golden Barrel Cactus!")
