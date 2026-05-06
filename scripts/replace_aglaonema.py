import json
import os
import re

# Path to plants.json
PLANTS_JSON_PATH = r'f:\Rimi\plant2\Easy-Grow-Plants\frontend\src\data\plants\plants.json'

# New varieties list provided by user
new_varieties_str = "Siam Aurora, Red Anjamani, Red Star, Red Zircon, Red Gold, Red King, Red Sunkist, Red Valentine, Red Master, Red Peacock, Red Emerald, Firecracker, Lady Valentine, Pink Dalmatian, Pink Beauty, Pink Passion, Pink Moon, Rosy, Pink Aurora, Pink Kiss, Legacy, Super Pink, Pink Happiness, Pink Champagne, Silver Queen, Silver King, Snow White, First Diamond, White Rain, Diamond Bay, Silver Bay, White Joy, Stardust, Spring Snow, Modestum, Black Lance, Maria, Emerald Bay, Green Papaya, Black Panther, Tigress, Cutlass, Jade, Abidjan, Pictum Tricolor, Anyanmanee, Khanza, Suksom Jaiprang, Lotus Delight, Golden Fluorite, Harlequin, Chocolate"

new_varieties_list = [x.strip() for x in new_varieties_str.split(',')]

def get_id(name):
    # Remove special chars and lowercase
    clean_name = name.lower()
    clean_name = clean_name.replace('‘', '').replace('’', '').replace('(', '').replace(')', '')
    clean_name = re.sub(r'\s+', '-', clean_name)
    return clean_name

def get_care_template(name):
    name_lower = name.lower()
    
    # Base care templates
    care_red = {
        "water": "Allow soil to dry out slightly more than green varieties. Avoid overwatering to prevent root rot.",
        "light": "Needs medium to bright indirect light to maintain vibrant red colors. Low light causes color fading.",
        "soil": "Well-draining, slightly acidic potting mix.",
        "toxicity": "Toxic to pets if ingested."
    }
    
    care_silver = {
        "water": "Keep soil evenly moist but not waterlogged. Allow the top inch to dry slightly.",
        "light": "Tolerates low light well, but prefers medium indirect light to maintain silver coloration.",
        "soil": "Peat-based potting mix with good aeration.",
        "toxicity": "Toxic to pets if ingested."
    }
    
    care_green = {
        "water": "Water deeply when the top 2 inches of soil are dry.",
        "light": "Can tolerate lower light conditions than variegated varieties. Avoid direct sun.",
        "soil": "Standard well-draining houseplant mix.",
        "toxicity": "Toxic to pets if ingested."
    }

    if 'red' in name_lower or 'pink' in name_lower or 'firecracker' in name_lower or 'rosy' in name_lower or 'chocolate' in name_lower or 'suksom' in name_lower:
        return care_red
    elif 'silver' in name_lower or 'snow' in name_lower or 'diamond' in name_lower or 'white' in name_lower or 'stardust' in name_lower:
        return care_silver
    else:
        return care_green

def get_description(name):
    name_lower = name.lower()
    if 'siam aurora' in name_lower:
         return "Also known as the 'Red Aglaonema', it features stunning red edges and stems."
    elif 'anyanmanee' in name_lower:
        return "Broad leaves speckled with three colors: pink, green, and white."
    elif 'suksom' in name_lower:
        return "An extremely vibrant red variety that is highly sought after by collectors."
    elif 'pictum tricolor' in name_lower:
        return "Famous for its camouflage-like pattern of light green, dark green, and silver-white."
    elif 'red' in name_lower:
        return f"A vibrant Aglaonema variety ('{name}') showcasing striking red variegation."
    elif 'pink' in name_lower or 'rosy' in name_lower:
        return f"Beautiful {name} features soft to bright pink hues on its foliage."
    elif 'silver' in name_lower or 'snow' in name_lower or 'diamond' in name_lower:
        return f"The {name} offers elegant silvery-white patterns that brighten up low-light spaces."
    elif 'white' in name_lower:
        return f"Features crisp white variegation resembling fresh snow."
    elif 'black' in name_lower or 'chocolate' in name_lower:
        return f"A dramatic variety with dark, rich foliage often bordering on black or deep chocolate."
    else:
        return f"An attractive Aglaonema variety ('{name}') known for its easy care and beautiful leaf patterns."

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

    # Clear existing varieties
    print(f"Replacing {len(aglaonema_category.get('varieties', []))} existing varieties with {len(new_varieties_list)} new ones.")
    aglaonema_category['varieties'] = []
    
    new_entries = []
    seen_ids = set()

    for name in new_varieties_list:
        new_id = get_id(name)
        
        if new_id in seen_ids:
            print(f"Skipping duplicate in new list: {name}")
            continue
            
        care_data = get_care_template(name)
        description = get_description(name)
        
        new_entry = {
            "id": new_id,
            "name": name,
            "description": description,
            "care": care_data,
            "image": f"/images/aglaonema-{new_id}.jpg"
        }
        
        new_entries.append(new_entry)
        seen_ids.add(new_id)
        
    aglaonema_category['varieties'] = new_entries
    
    with open(PLANTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print("Successfully replaced Aglaonema varieties in plants.json")

if __name__ == "__main__":
    main()
