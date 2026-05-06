import os
import sys
import django
import urllib.request
import urllib.parse
import json
from django.core.files.base import ContentFile

project_root = os.path.abspath('.')
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant

try:
    print("Searching Wikimedia for Dracaena Lemon Lime...")
    search_term = "Dracaena fragrans"
    # We will fetch a natural photo of Dracaena fragrans Massangeana/Lemon Lime
    url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(search_term)}&gsrlimit=10&prop=imageinfo&iiprop=url&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.68.0'})
    resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    
    pages = resp.get('query', {}).get('pages', {})
    
    found_good_image = False
    for page_id, data in pages.items():
        img_url = data['imageinfo'][0]['url']
        # Avoid the Köhler's book illustration
        if "Medizinal-Pflanzen" not in img_url and "K%C3%B6hler" not in img_url and img_url.endswith('.jpg'):
            print(f"Found better image: {img_url}")
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'curl/7.68.0'})
            img_data = urllib.request.urlopen(img_req, timeout=10).read()
            
            p = Plant.objects.get(plant_name='Dracena Lemon Lime')
            p.image_url.save('Dracena_Lemon_Lime.jpg', ContentFile(img_data), save=True)
            print("Successfully updated Dracena Lemon Lime!")
            found_good_image = True
            break

    if not found_good_image:
        print("Could not find a better image.")
except Exception as e:
    print('Error:', e)
