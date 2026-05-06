import os
import sys
import django
import urllib.request
import urllib.parse
import json
from pathlib import Path
from django.core.files.base import ContentFile

project_root = str(Path(__file__).resolve().parent)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant

# List of plants the user wants exact distinct pictures for
plants_to_fix = [
    "ZZ Zamifolia", "ZZ Raven",
    "Dracena Lemon Lime", "Dracena Marginata",
    "Syngonium Albo", "Syngonium Neon Robusta",
    "Philodendron Birkin", "Philodendron Pink Princess",
    "Rare Monstera Variegata", "Monstera Deliciosa", "Monstera Adansonii"
]

for plant_name in plants_to_fix:
    try:
        plant = Plant.objects.get(plant_name=plant_name)
    except Plant.DoesNotExist:
        print(f"Skipping {plant_name}, not found in DB.")
        continue

    print(f"Searching Wikimedia for {plant.plant_name}...")
    
    # Improve search accuracy for Wikimedia
    search_term = plant.plant_name
    if "ZZ " in search_term:
        search_term = search_term.replace("ZZ ", "Zamioculcas zamiifolia ")
    if "Dracena" in search_term:
        search_term = search_term.replace("Dracena", "Dracaena")
        
    query = urllib.parse.quote(search_term)
    url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={query}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json'
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        resp_data = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        resp = json.loads(resp_data)
        
        if 'query' in resp and 'pages' in resp['query']:
            pages = resp['query']['pages']
            page_id = list(pages.keys())[0]
            img_url = pages[page_id]['imageinfo'][0]['url']
            
            print(f"Downloading {img_url}...")
            # Some wikimedia images are massive. We request the thumbnail!
            # The thumbnail URL is derived from the image URL or we can request it via API.
            # It's better to just download the original but with a timeout.
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(img_req, timeout=15).read()
            
            filename = f"{plant.plant_name.replace(' ', '_')}.jpg"
            plant.image_url.save(filename, ContentFile(img_data), save=True)
            print(f"Saved {filename} locally!")
        else:
            # Try a less strict search
            fallback_query = urllib.parse.quote(plant.plant_name.split()[0])
            fallback_url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={fallback_query}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json'
            
            req_fall = urllib.request.Request(fallback_url, headers={'User-Agent': 'Mozilla/5.0'})
            resp_data_fall = urllib.request.urlopen(req_fall, timeout=10).read().decode('utf-8')
            resp_fall = json.loads(resp_data_fall)
            
            if 'query' in resp_fall and 'pages' in resp_fall['query']:
                pages = resp_fall['query']['pages']
                page_id = list(pages.keys())[0]
                img_url = pages[page_id]['imageinfo'][0]['url']
                print(f"Downloading fallback {img_url}...")
                img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                img_data = urllib.request.urlopen(img_req, timeout=15).read()
                filename = f"{plant.plant_name.replace(' ', '_')}.jpg"
                plant.image_url.save(filename, ContentFile(img_data), save=True)
                print(f"Saved {filename} locally!")
            else:
                print(f"No results on Wikimedia for {plant.plant_name}.")
                
    except Exception as e:
        print(f"Error for {plant.plant_name}: {e}")

print("Done updating identical images.")
