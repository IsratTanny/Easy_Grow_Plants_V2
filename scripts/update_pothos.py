import json
from pathlib import Path

def update_pothos_data():
    base_path = Path(__file__).resolve().parent.parent / 'frontend/src/data/plants'
    plants_file = base_path / 'plants.json'
    pothos_update_file = base_path / 'pothos_update.json'

    with open(plants_file, 'r') as f:
        plants_data = json.load(f)
    
    with open(pothos_update_file, 'r') as f:
        pothos_new_data = json.load(f) # This is a list containing one object
        
    pothos_obj = pothos_new_data[0]

    # Find and update
    for i, plant in enumerate(plants_data):
        if plant['id'] == 'pothos':
            plants_data[i] = pothos_obj
            break
    
    with open(plants_file, 'w') as f:
        json.dump(plants_data, f, indent=4)
        print("Updated Pothos data in plants.json")

if __name__ == '__main__':
    update_pothos_data()
