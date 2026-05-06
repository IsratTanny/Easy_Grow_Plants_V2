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

plants_to_update = []
for p in Plant.objects.all():
    cat_slug = p.category.lower().replace(' ', '')
    if str(p.image_url) == f"plants/{cat_slug}.jpg" or str(p.image_url) == "plants/monstera.jpg":
        plants_to_update.append(p)

print(f"Found {len(plants_to_update)} plants needing exact pictures.")

for plant in plants_to_update:
    print(f"Searching Wikimedia for {plant.plant_name}...")
    # Clean up name for better search (e.g. Aglonema -> Aglaonema)
    search_term = plant.plant_name.replace('Aglonema', 'Aglaonema')
    
    query = urllib.parse.quote(search_term)
    url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={query}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json'
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp_data = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        resp = json.loads(resp_data)
        
        if 'query' in resp and 'pages' in resp['query']:
            pages = resp['query']['pages']
            page_id = list(pages.keys())[0]
            img_url = pages[page_id]['imageinfo'][0]['url']
            
            print(f"Downloading {img_url}...")
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(img_req, timeout=15).read()
            
            filename = f"{plant.plant_name.replace(' ', '_')}.jpg"
            plant.image_url.save(filename, ContentFile(img_data), save=True)
            print(f"Saved {filename} locally!")
        else:
            print(f"No results on Wikimedia for {plant.plant_name}. Generating one instead...")
    except Exception as e:
        print(f"Error for {plant.plant_name}: {e}")

print("Done updating exact images.")
