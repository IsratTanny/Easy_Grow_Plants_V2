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
    category_id = category.get('id') # e.g. "aglonema", "pothos"
    
    for v in varieties:
        img_path = v.get('image')
        if not img_path:
            continue
            
        filename = os.path.basename(img_path)
        dest_path = os.path.join(public_img_dir, filename)
        
        search_term = v['name']
        print(f"Downloading fixed LoremFlickr for {search_term}...")
        
        # Hash seed so each plant gets a unique image, but consistently the same unique image
        seed = abs(hash(search_term)) % 10000
        
        # Use the category_id (genus) and "plant" to ensure it's a botanical picture!
        url = f"https://loremflickr.com/400/400/{category_id},plant?lock={seed}"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(req, timeout=10).read()
            
            with open(dest_path, 'wb') as img_file:
                img_file.write(img_data)
            print(f"Saved {filename}!")
            
        except Exception as e:
            print(f"Error for {search_term}: {e}")

print("Done replacing with actual plant images.")
