import os
import sys
import django
import urllib.request
import json
from pathlib import Path
from django.core.files.base import ContentFile

project_root = str(Path(__file__).resolve().parent)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant

# Map plant name to wikipedia article title
plants_to_fix = {
    "Syngonium Neon Robusta": "Syngonium",
    "Philodendron Birkin": "Philodendron",
    "Rare Monstera Variegata": "Variegation",
    "Monstera Deliciosa": "Monstera_deliciosa"
}

for plant_name, wiki_title in plants_to_fix.items():
    try:
        plant = Plant.objects.get(plant_name=plant_name)
    except Plant.DoesNotExist:
        continue

    print(f"Fetching thumbnail for {plant_name}...")
    url = f'https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_title}'
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp_data = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        resp = json.loads(resp_data)
        
        if 'thumbnail' in resp:
            img_url = resp['thumbnail']['source']
            print(f"Downloading {img_url}...")
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(img_req, timeout=15).read()
            
            filename = f"{plant.plant_name.replace(' ', '_')}.jpg"
            plant.image_url.save(filename, ContentFile(img_data), save=True)
            print(f"Saved {filename} locally!")
        else:
            print(f"No thumbnail found for {wiki_title}")
            
    except Exception as e:
        print(f"Error for {plant_name}: {e}")

print("Done downloading thumbnails.")
