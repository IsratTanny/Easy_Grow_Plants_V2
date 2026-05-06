import os
import sys
import json
import urllib.request
import urllib.parse
import time
from pathlib import Path

project_root = os.path.abspath('.')
data_file = os.path.join(project_root, 'frontend', 'src', 'data', 'plants', 'plants.json')
public_img_dir = os.path.join(project_root, 'frontend', 'public', 'images')

with open(data_file, 'r', encoding='utf-8') as f:
    categories = json.load(f)

def get_wiki_thumbnail(title):
    url = f'https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'EasyGrowBot/1.0 (contact: admin@example.com)'})
        resp = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
        if 'thumbnail' in resp:
            return resp['thumbnail']['source']
    except Exception as e:
        pass
    return None

for category in categories:
    varieties = category.get('varieties', [])
    for v in varieties:
        img_path = v.get('image')
        if not img_path:
            continue
            
        filename = os.path.basename(img_path)
        dest_path = os.path.join(public_img_dir, filename)
        
        # We want to overwrite the loremflickr images, so we don't check os.path.exists
        
        search_term = v['name']
        print(f"Searching Wikipedia REST API for {search_term}...")
        
        # Try exact match (replace spaces with underscores)
        img_url = get_wiki_thumbnail(search_term.replace(' ', '_'))
        
        # Try without quotes/special chars
        if not img_url and ' ' in search_term:
            img_url = get_wiki_thumbnail(search_term.split()[0] + '_' + search_term.split()[1])
            
        # Try genus only (first word)
        if not img_url:
            genus = search_term.split()[0]
            print(f"Fallback to genus {genus}...")
            img_url = get_wiki_thumbnail(genus)
            
        if img_url:
            try:
                print(f"Downloading {img_url} to {filename}...")
                img_req = urllib.request.Request(img_url, headers={'User-Agent': 'EasyGrowBot/1.0'})
                img_data = urllib.request.urlopen(img_req, timeout=10).read()
                
                with open(dest_path, 'wb') as img_file:
                    img_file.write(img_data)
                print(f"Saved {filename}!")
            except Exception as e:
                print(f"Failed to download image for {search_term}: {e}")
        else:
            print(f"Could not find any Wikipedia thumbnail for {search_term}")
            
        time.sleep(1.0) # Sleep to avoid rate limits

print("Done fetching accurate plant care images.")
