import os
import sys
import django
import urllib.request
import re
from pathlib import Path
from django.core.files.base import ContentFile

project_root = str(Path(__file__).resolve().parent)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant

plants = Plant.objects.filter(image_url__icontains='unsplash.com')
print(f"Found {plants.count()} plants to update.")

for plant in plants:
    query = plant.plant_name.replace(' ', '+') + '+plant'
    url = f'https://www.google.com/search?q={query}&tbm=isch'
    print(f"Fetching {plant.plant_name}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        img_urls = re.findall(r'<img[^>]+src="([^"]+)"', html)
        if len(img_urls) > 1:
            img_url = img_urls[1] # 0 is usually google logo
            if img_url.startswith('/'):
                continue
            # Download the image
            img_data = urllib.request.urlopen(img_url).read()
            # Save it
            filename = f"{plant.plant_name.replace(' ', '_')}.jpg"
            plant.image_url.save(filename, ContentFile(img_data), save=True)
            print(f"Saved {filename}")
        else:
            print(f"No image found for {plant.plant_name}")
    except Exception as e:
        print(f"Error for {plant.plant_name}: {e}")
