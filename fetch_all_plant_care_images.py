import os
import sys
import json
import urllib.request
import urllib.parse
from pathlib import Path

project_root = os.path.abspath('.')
data_file = os.path.join(project_root, 'frontend', 'src', 'data', 'plants', 'plants.json')
public_img_dir = os.path.join(project_root, 'frontend', 'public', 'images')

with open(data_file, 'r', encoding='utf-8') as f:
    categories = json.load(f)

for category in categories:
    varieties = category.get('varieties', [])
    for v in varieties:
        img_path = v.get('image')
        if not img_path:
            continue
            
        filename = os.path.basename(img_path)
        dest_path = os.path.join(public_img_dir, filename)
        
        if os.path.exists(dest_path):
            continue
            
        search_term = v['name']
        print(f"Downloading LoremFlickr for {search_term}...")
        
        # We add a small random seed query param so loremflickr returns different images
        # We hash the search term to get a unique but consistent seed
        seed = abs(hash(search_term)) % 10000
        url = f"https://loremflickr.com/400/400/plant,leaf?lock={seed}"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(req, timeout=10).read()
            
            with open(dest_path, 'wb') as img_file:
                img_file.write(img_data)
            print(f"Saved {filename}!")
            
        except Exception as e:
            print(f"Error for {search_term}: {e}")

print("Done fetching all missing plant care images.")
