import json
import random
from pathlib import Path

# Helper to merge existing plants.json and expansion
def merge_and_save_data():
    # Correct path calculation: script is in /scripts, root is parent
    root_dir = Path(__file__).resolve().parent.parent
    base_path = root_dir / 'frontend' / 'src' / 'data' / 'plants'
    original_file = base_path / 'plants.json'
    expansion_file = base_path / 'plants_expansion.json'

    if not original_file.exists():
        print(f"Error: {original_file} not found")
        return []
    
    with open(original_file, 'r') as f:
        original_data = json.load(f)
    
    if expansion_file.exists():
        with open(expansion_file, 'r') as f:
            expansion_data = json.load(f)
        # Simple merge: append expansion to original
        merged_data = original_data + expansion_data
    else:
        merged_data = original_data

    # Optional: Save back if needed, but for import we just return it
    return merged_data

def import_data_to_django():
    from backend.apps.plant_care.models import PlantCategory, PlantVariety
    from backend.apps.marketplace.models import Plant
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    admin_user = User.objects.filter(role='admin').first() or User.objects.filter(is_superuser=True).first()
    
    data = merge_and_save_data()
    if not data:
        return
    
    print("Starting import to Django models...")
    for cat_data in data:
        print(f"Processing Category: {cat_data['name']}")
        
        # Create or Update Category
        category, created = PlantCategory.objects.update_or_create(
            slug=cat_data['id'],
            defaults={
                'name': cat_data['name'],
                'plant_type': cat_data.get('type', ''),
                'care_type': cat_data.get('careType', 'general'),
                'image_url': cat_data.get('image', ''),
                'water_care': cat_data.get('care', {}).get('water', '') if cat_data.get('care') else '',
                'light_care': cat_data.get('care', {}).get('light', '') if cat_data.get('care') else '',
                'soil_care': cat_data.get('care', {}).get('soil', '') if cat_data.get('care') else '',
                'toxicity_care': cat_data.get('care', {}).get('toxicity', '') if cat_data.get('care') else '',
            }
        )
        
        # Process Varieties
        for var_data in cat_data.get('varieties', []):
             var_care = var_data.get('care', {})
             
             # Create a unique slug to avoid IntegrityError
             unique_slug = f"{cat_data['id']}-{var_data['id']}"
             
             variety, v_created = PlantVariety.objects.update_or_create(
                 slug=unique_slug,
                 category=category,
                 defaults={
                     'name': var_data['name'],
                     'description': var_data.get('description', ''),
                     'image_url': var_data.get('image', ''),
                     'water_care': var_care.get('water', ''),
                     'light_care': var_care.get('light', ''),
                     'soil_care': var_care.get('soil', ''),
                     'toxicity_care': var_care.get('toxicity', '')
                 }
             )

             # Also add some to Marketplace if they have a description
             if admin_user and var_data.get('description'):
                 care_info = f"Light: {variety.light_care or category.light_care}\nWater: {variety.water_care or category.water_care}"
                 Plant.objects.update_or_create(
                     plant_name=variety.name,
                     seller=admin_user,
                     defaults={
                         'description': f"{variety.description}\n\nCARE INSTRUCTIONS:\n{care_info}",
                         'price': random.randint(15, 50),
                         'stock_quantity': random.randint(5, 20),
                         'image_url': variety.image_url,
                         'category': category.name,
                     }
                 )

    print("Import completed successfully!")

if __name__ == '__main__':
    import os
    import sys
    import django

    # Setup Django environment
    # Project root is parent of scripts
    project_root = str(Path(__file__).resolve().parent.parent)
    sys.path.append(project_root)
    
    # settings is at backend/core/config/settings.py
    # If project_root is in sys.path, we can use 'backend.core.config.settings'
    # Or add project_root/backend/core to sys.path and use 'config.settings'
    
    sys.path.append(os.path.join(project_root, 'backend', 'core'))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

    import_data_to_django()
