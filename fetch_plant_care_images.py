import os
import sys
import json
import urllib.request
import urllib.parse
from pathlib import Path

project_root = os.path.abspath('.')
data_dir = os.path.join(project_root, 'frontend', 'src', 'data', 'plants')
public_img_dir = os.path.join(project_root, 'frontend', 'public', 'images')

# List of all json files in data_dir (e.g., pothos_varieties.json, monstera_varieties.json, etc.)
# Wait, the user specifically mentioned "like all the plant here showed", which means at least the Pothos ones.
# Actually, I can just process all JSON files in the data directory!

json_files = [f for f in os.listdir(data_dir) if f.endswith('.json') and 'varieties' in f]

for j_file in json_files:
    file_path = os.path.join(data_dir, j_file)
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            varieties = json.load(f)
        except json.JSONDecodeError:
            continue
            
    for v in varieties:
        img_path = v.get('image')
        if not img_path:
            continue
            
        # img_path looks like "/images/pothos-neon.jpg"
        filename = os.path.basename(img_path)
        dest_path = os.path.join(public_img_dir, filename)
        
        if os.path.exists(dest_path):
            print(f"Skipping {filename}, already exists.")
            continue
            
        search_term = v['name']
        print(f"Searching Wikipedia for {search_term}...")
        
        url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(search_term)}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.68.0'})
            resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
            pages = resp.get('query', {}).get('pages', {})
            
            if not pages:
                # Try fallback
                fallback = search_term.split()[0] + " " + search_term.split()[1] if len(search_term.split()) > 1 else search_term
                url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(fallback)}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json'
                req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.68.0'})
                resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
                pages = resp.get('query', {}).get('pages', {})

            if pages:
                page_id = list(pages.keys())[0]
                download_url = pages[page_id]['imageinfo'][0]['url']
                
                print(f"Downloading {download_url} to {dest_path}")
                img_req = urllib.request.Request(download_url, headers={'User-Agent': 'curl/7.68.0'})
                img_data = urllib.request.urlopen(img_req, timeout=10).read()
                
                with open(dest_path, 'wb') as img_file:
                    img_file.write(img_data)
                print(f"Saved {filename}!")
            else:
                print(f"No results for {search_term}")
                
                # If no wiki image, fallback to loremflickr
                print(f"Fallback to LoremFlickr for {search_term}...")
                lf_url = "https://loremflickr.com/400/400/plant,leaf"
                img_req = urllib.request.Request(lf_url, headers={'User-Agent': 'curl/7.68.0'})
                img_data = urllib.request.urlopen(img_req, timeout=10).read()
                with open(dest_path, 'wb') as img_file:
                    img_file.write(img_data)
                print(f"Saved {filename} from LoremFlickr!")
                
        except Exception as e:
            print(f"Error for {search_term}: {e}")

print("Done fetching plant care images.")
