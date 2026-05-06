import os
import sys
import django
import urllib.request
from pathlib import Path
from django.core.files.base import ContentFile

project_root = str(Path(__file__).resolve().parent)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant

plants = Plant.objects.filter(image_url__icontains='unsplash.com')
print(f"Found {plants.count()} plants with Unsplash URLs.")

for plant in plants:
    url = str(plant.image_url)
    print(f"Downloading for {plant.plant_name}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        img_data = urllib.request.urlopen(req).read()
        
        filename = f"{plant.plant_name.replace(' ', '_')}.jpg"
        # Overwrite the URL with the local file
        plant.image_url.save(filename, ContentFile(img_data), save=True)
        print(f"Saved {filename} locally!")
    except Exception as e:
        print(f"Error for {plant.plant_name}: {e}")
