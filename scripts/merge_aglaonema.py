import json
import os
import re

# Path to plants.json
PLANTS_JSON_PATH = r'f:\Rimi\plant2\Easy-Grow-Plants\frontend\src\data\plants\plants.json'

# New varieties list
new_varieties_str = "Red Gold, Red Sunshine, Red Gold King, Red Star, Red Sunkist, Red Leopard, Red Infinity, Pink Delight, Pink Beauty, Pink Christina, Pink Champagne, Pink Kiss, Rosy, Rose Beauty, Green Gold, Green Jewel, Green Tiger, Green Valentine, Silver King, Silver Queen, Silver Delight, Silver Spot, Silver Frost, Green Harmony, Tropical Snow, Tricolor, Diamond Bay, Magic Star, Marble Queen, Fancy Leaf, Sparkling Diamond, Silver Mosaic, Mystic Marble, Rainbow, Galaxy, Black Jade, Black Panther, Black Magic, Dark Knight, Emerald Knight, Jade Compacta, Silver Velvet, Golden Flame, Fiesta, Burgundy Beauty, Ruby Glow, Sunset Valley, Blush Queen, Aurora Glow, Mint Marvel, Fireworks, Coral Charm, Champagne Sparkle, Velvet Queen, Neon Star"

new_varieties_list = [x.strip() for x in new_varieties_str.split(',')]

def get_id(name):
    return name.lower().replace(' ', '-')

def get_care_template(name, existing_varieties):
    # Try to determine care based on color keywords
    name_lower = name.lower()
    
    # Defaults
    red_care = None
    silver_care = None
    
    for v in existing_varieties:
        if v['id'] == 'red-valentine':
            red_care = v.get('care')
        if v['id'] == 'silver-bay':
            silver_care = v.get('care')
            
    if not red_care and not silver_care and existing_varieties:
         # Fallback to first available care if specifics not found
         silver_care = existing_varieties[0].get('care')

    if 'red' in name_lower or 'pink' in name_lower or 'rosy' in name_lower or 'ruby' in name_lower or 'blush' in name_lower or 'coral' in name_lower:
        return red_care if red_care else silver_care
    return silver_care if silver_care else red_care

def get_description(name):
    name_lower = name.lower()
    if 'red' in name_lower:
        return f"A stunning Aglaonema variety featuring vibrant red variegation on its leaves."
    elif 'pink' in name_lower or 'rosy' in name_lower or 'blush' in name_lower:
        return f"Beautiful {name} variety known for its soft pink hues and elegant foliage."
    elif 'silver' in name_lower or 'diamond' in name_lower or 'snow' in name_lower:
        return f"Distinguished by its silvery leaf patterns, {name} adds a touch of brightness to any room."
    elif 'green' in name_lower or 'jade' in name_lower or 'emerald' in name_lower:
        return f"A lush, green variety of Aglaonema, perfcet for adding dense foliage to your space."
    elif 'black' in name_lower or 'dark' in name_lower:
        return f"Features deep, dark foliage that provides a striking contrast in your plant collection."
    elif 'gold' in name_lower or 'yellow' in name_lower:
        return f"Accented with golden tones, this {name} is a radiant addition to your indoor garden."
    elif 'white' in name_lower:
        return f"Showcases bright white variegation that stands out against green leaf margins."
    else:
        return f"The {name} helps purify the air and adds a decorative touch with its unique patterned leaves."

def main():
    if not os.path.exists(PLANTS_JSON_PATH):
        print(f"Error: {PLANTS_JSON_PATH} not found.")
        return

    with open(PLANTS_JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Find Aglaonema category
    aglaonema_category = None
    for cat in data:
        if cat.get('id') == 'aglaonema':
            aglaonema_category = cat
            break
    
    if not aglaonema_category:
        print("Error: Aglaonema category not found in plants.json")
        return

    existing_varieties = aglaonema_category.get('varieties', [])
    existing_ids = {v['id'] for v in existing_varieties}
    
    print(f"Found {len(existing_varieties)} existing varieties.")

    added_count = 0
    for name in new_varieties_list:
        new_id = get_id(name)
        
        if new_id in existing_ids:
            print(f"Skipping duplicate: {name} (id: {new_id})")
            continue
            
        care_data = get_care_template(name, existing_varieties)
        description = get_description(name)
        
        new_entry = {
            "id": new_id,
            "name": name,
            "description": description,
            "care": care_data,
            "image": f"/images/aglaonema-{new_id}.jpg"
        }
        
        existing_varieties.append(new_entry)
        existing_ids.add(new_id)
        added_count += 1
        
    print(f"Added {added_count} new varieties.")
    
    aglaonema_category['varieties'] = existing_varieties
    
    with open(PLANTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print("Successfully updated plants.json")

if __name__ == "__main__":
    main()
