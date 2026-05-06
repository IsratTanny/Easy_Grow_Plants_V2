import json
import os
import re

# Path to plants.json
PLANTS_JSON_PATH = r'f:\Rimi\plant2\Easy-Grow-Plants\frontend\src\data\plants\plants.json'

# New varieties list
new_varieties_str = "Deliciosa, Deliciosa ‘Borsigiana’, Adansonii (Swiss Cheese Vine), Adansonii ‘Narrow Form’, Adansonii ‘Wide Form’, Standleyana, Dubia, Siltepecana, Pinnatipartita, Deliciosa ‘Albo Variegata’, Deliciosa ‘Thai Constellation’, Deliciosa ‘Aurea’ (Marmorata), Deliciosa ‘Mint Variegata’, Deliciosa ‘White Monster’, Adansonii ‘Albo Variegata’, Adansonii ‘Aurea Variegata’, Standleyana ‘Albo Variegata’, Obliqua, Karstenianum (Peru), Lechleriana, Acuminata, Subpinnata, Epipremnoides, Spruceana, Deliciosa ‘Compacta’"

# Split by comma handling the quoted parts correctly if needed, but simple split works here
# Clean up the names
new_varieties_list = [x.strip() for x in new_varieties_str.split(',')]

def get_id(name):
    # Remove special chars and lowercase
    clean_name = name.lower()
    clean_name = clean_name.replace('‘', '').replace('’', '').replace('(', '').replace(')', '')
    clean_name = re.sub(r'\s+', '-', clean_name)
    return clean_name

def get_care_template(name, existing_varieties):
    name_lower = name.lower()
    
    # Defaults
    deliciosa_care = None
    adansonii_care = None
    
    for v in existing_varieties:
        if v['id'] == 'deliciosa':
            deliciosa_care = v.get('care')
        if v['id'] == 'adansonii':
            adansonii_care = v.get('care')
            
    if 'adansonii' in name_lower or 'obliqua' in name_lower or 'siltepecana' in name_lower:
        return adansonii_care if adansonii_care else deliciosa_care
    return deliciosa_care if deliciosa_care else adansonii_care

def get_description(name):
    name_lower = name.lower()
    if 'deliciosa' in name_lower:
        if 'variegata' in name_lower or 'thai' in name_lower or 'albo' in name_lower:
             return f"A highly sought-after variegated form of Monstera Deliciosa causing a sensation in the plant world."
        return f"A distinct variety of the classic Monstera Deliciosa, known for its iconic split leaves."
    elif 'adansonii' in name_lower:
         if 'variegata' in name_lower or 'albo' in name_lower:
             return "A rare, variegated version of the Swiss Cheese Vine with stunning coloration."
         return f"A unique form of the Swiss Cheese Vine ({name}) with characteristic holes in the leaves."
    elif 'dubia' in name_lower:
        return "Known for its shingling habit, leaves lie flat against the climbing surface when young."
    elif 'obliqua' in name_lower:
        return "The unicorn of the aroid world, featuring extremely fenestrated leaves that are more hole than leaf."
    elif 'standleyana' in name_lower:
        return "An elegant climber with lance-shaped, dark green leaves often splashed with white or yellow."
    elif 'peru' in name_lower or 'karstenianum' in name_lower:
        return "Features rigid, puckered, dark green leaves with a unique texture."
    else:
        return f"A beautiful Monstera species ({name}) that adds tropical flair to any indoor garden."

def main():
    if not os.path.exists(PLANTS_JSON_PATH):
        print(f"Error: {PLANTS_JSON_PATH} not found.")
        return

    with open(PLANTS_JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Find Monstera category
    monstera_category = None
    for cat in data:
        if cat.get('id') == 'monstera':
            monstera_category = cat
            break
    
    if not monstera_category:
        print("Error: Monstera category not found in plants.json")
        return

    existing_varieties = monstera_category.get('varieties', [])
    existing_ids = {v['id'] for v in existing_varieties}
    
    # Add mapped IDs for existing ones to avoid dupes if naming differs slightly
    # e.g. "Monstera Deliciosa" vs "Deliciosa"
    # The existing IDs are 'deliciosa' and 'adansonii'
    
    print(f"Found {len(existing_varieties)} existing varieties.")

    added_count = 0
    for name in new_varieties_list:
        # Construct a display name that looks good
        display_name = name
        if not display_name.lower().startswith("monstera"):
            display_name = f"Monstera {name}"
            
        new_id = get_id(name)
        
        # Check for duplicates more loosely
        is_duplicate = False
        if new_id in existing_ids:
            is_duplicate = True
        
        # Specific checks for base types
        if new_id == 'deliciosa' and 'deliciosa' in existing_ids:
            is_duplicate = True
        if new_id == 'adansonii-swiss-cheese-vine' and 'adansonii' in existing_ids:
            # map to existing adansonii
             is_duplicate = True
        
        if is_duplicate:
            print(f"Skipping duplicate: {name} (id: {new_id})")
            continue
            
        care_data = get_care_template(name, existing_varieties)
        description = get_description(name)
        
        new_entry = {
            "id": new_id,
            "name": display_name,
            "description": description,
            "care": care_data,
            "image": f"/images/monstera-{new_id}.jpg"
        }
        
        existing_varieties.append(new_entry)
        existing_ids.add(new_id)
        added_count += 1
        
    print(f"Added {added_count} new varieties.")
    
    monstera_category['varieties'] = existing_varieties
    
    with open(PLANTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print("Successfully updated plants.json with Monstera varieties")

if __name__ == "__main__":
    main()
