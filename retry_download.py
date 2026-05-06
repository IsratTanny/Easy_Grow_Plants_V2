import os
import sys
import django
import urllib.request
import urllib.parse
import json
import time
from pathlib import Path
from django.core.files.base import ContentFile

project_root = str(Path(__file__).resolve().parent)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant

plants_to_retry = [
    "ZZ Raven",
    "Syngonium Neon Robusta",
    "Philodendron Birkin",
    "Rare Monstera Variegata",
    "Monstera Deliciosa"
]

for plant_name in plants_to_retry:
    try:
        plant = Plant.objects.get(plant_name=plant_name)
    except Plant.DoesNotExist:
        continue

    print(f"Retrying Wikimedia for {plant.plant_name}...")
    search_term = plant.plant_name
    if "ZZ " in search_term:
        search_term = search_term.replace("ZZ ", "Zamioculcas zamiifolia ")
    
    query = urllib.parse.quote(search_term)
    url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={query}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json'
    
    try:
        time.sleep(3) # Wait 3 seconds to avoid rate limits
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        resp_data = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        resp = json.loads(resp_data)
        
        if 'query' in resp and 'pages' in resp['query']:
            pages = resp['query']['pages']
            page_id = list(pages.keys())[0]
            img_url = pages[page_id]['imageinfo'][0]['url']
            
            print(f"Downloading {img_url}...")
            # Use an alternative User-Agent for image download to avoid blocks
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'curl/7.68.0'})
            img_data = urllib.request.urlopen(img_req, timeout=15).read()
            
            filename = f"{plant.plant_name.replace(' ', '_')}.jpg"
            plant.image_url.save(filename, ContentFile(img_data), save=True)
            print(f"Saved {filename} locally!")
        else:
            print(f"No results for {plant.plant_name}")
    except Exception as e:
        print(f"Error for {plant.plant_name}: {e}")

print("Done retrying.")
