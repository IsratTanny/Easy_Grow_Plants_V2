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
    print("Searching Wikimedia for Alocasia Polly (Alocasia amazonica)...")
    search_term = "Alocasia amazonica"
    url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(search_term)}&gsrlimit=3&prop=imageinfo&iiprop=url&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.68.0'})
    resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    
    pages = resp.get('query', {}).get('pages', {})
    if pages:
        page_id = list(pages.keys())[0]
        img_url = pages[page_id]['imageinfo'][0]['url']
        print(f"Found image: {img_url}")
        
        img_req = urllib.request.Request(img_url, headers={'User-Agent': 'curl/7.68.0'})
        img_data = urllib.request.urlopen(img_req, timeout=10).read()
        
        p = Plant.objects.get(plant_name='Alocasia Polly')
        p.image_url.save('Alocasia_Polly.jpg', ContentFile(img_data), save=True)
        print("Successfully updated Alocasia Polly!")
    else:
        print("Could not find image for Alocasia Polly")
except Exception as e:
    print('Error:', e)
