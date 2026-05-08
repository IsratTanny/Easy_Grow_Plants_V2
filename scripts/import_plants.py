import json
import random
import traceback
from pathlib import Path


def merge_and_save_data():
    root_dir = Path(__file__).resolve().parent.parent
    base_path = root_dir / 'frontend' / 'src' / 'data' / 'plants'
    original_file = base_path / 'plants.json'
    expansion_file = base_path / 'plants_expansion.json'

    if not original_file.exists():
        print(f"ERROR: {original_file} not found. Skipping plant import.")
        return []

    with open(original_file, 'r', encoding='utf-8') as f:
        original_data = json.load(f)

    if expansion_file.exists():
        with open(expansion_file, 'r', encoding='utf-8') as f:
            expansion_data = json.load(f)
        merged_data = original_data + expansion_data
    else:
        merged_data = original_data

    return merged_data


def import_data_to_django():
    from backend.apps.plant_care.models import PlantCategory, PlantVariety
    from backend.apps.marketplace.models import Plant
    from django.contrib.auth import get_user_model
    User = get_user_model()

    admin_user = (
        User.objects.filter(role='admin').first()
        or User.objects.filter(is_superuser=True).first()
    )

    if not admin_user:
        print("WARNING: No admin user found. Marketplace plant listings will be skipped.")

    data = merge_and_save_data()
    if not data:
        return

    print(f"Starting import of {len(data)} plant categories...")
    total_categories = 0
    total_varieties = 0
    total_listings = 0
    errors = 0

    for cat_data in data:
        try:
            cat_name = cat_data.get('name', 'Unknown Category')
            print(f"  Category: {cat_name}")

            # PlantCategory uses field 'name' (verified against model)
            category, created = PlantCategory.objects.update_or_create(
                slug=cat_data.get('id', cat_name.lower().replace(' ', '-')),
                defaults={
                    'name': cat_name,
                    'plant_type': cat_data.get('type', ''),
                    'care_type': cat_data.get('careType', 'general'),
                    'image_url': cat_data.get('image', ''),
                    'water_care': cat_data.get('care', {}).get('water', '') if cat_data.get('care') else '',
                    'light_care': cat_data.get('care', {}).get('light', '') if cat_data.get('care') else '',
                    'soil_care': cat_data.get('care', {}).get('soil', '') if cat_data.get('care') else '',
                    'toxicity_care': cat_data.get('care', {}).get('toxicity', '') if cat_data.get('care') else '',
                }
            )
            total_categories += 1

            for var_data in cat_data.get('varieties', []):
                try:
                    var_care = var_data.get('care', {})
                    unique_slug = f"{cat_data.get('id', 'cat')}-{var_data.get('id', 'var')}"

                    # PlantVariety uses field 'name' (verified against model)
                    variety, v_created = PlantVariety.objects.update_or_create(
                        slug=unique_slug,
                        category=category,
                        defaults={
                            'name': var_data.get('name', 'Unknown'),
                            'description': var_data.get('description', ''),
                            'image_url': var_data.get('image', ''),
                            'water_care': var_care.get('water', ''),
                            'light_care': var_care.get('light', ''),
                            'soil_care': var_care.get('soil', ''),
                            'toxicity_care': var_care.get('toxicity', ''),
                        }
                    )
                    total_varieties += 1

                    # Add to Marketplace — Plant uses 'plant_name' (verified against model)
                    if admin_user and var_data.get('description'):
                        try:
                            care_info = (
                                f"Light: {variety.light_care or category.light_care}\n"
                                f"Water: {variety.water_care or category.water_care}"
                            )
                            Plant.objects.update_or_create(
                                plant_name=variety.name,
                                seller=admin_user,
                                defaults={
                                    'description': f"{variety.description}\n\nCARE INSTRUCTIONS:\n{care_info}",
                                    'price': random.randint(15, 50),
                                    'stock_quantity': random.randint(5, 20),
                                    'image_url': variety.image_url or None,
                                    'category': category.name,
                                }
                            )
                            total_listings += 1
                        except Exception as e:
                            print(f"    WARNING: Marketplace listing failed for '{variety.name}': {e}")
                            errors += 1

                except Exception as e:
                    print(f"    WARNING: Variety '{var_data.get('name', '?')}' skipped: {e}")
                    errors += 1

        except Exception as e:
            print(f"  ERROR: Category '{cat_data.get('name', '?')}' skipped: {e}")
            traceback.print_exc()
            errors += 1

    print(f"\nImport complete!")
    print(f"  Categories: {total_categories}")
    print(f"  Varieties:  {total_varieties}")
    print(f"  Listings:   {total_listings}")
    if errors:
        print(f"  Warnings/Skipped: {errors} (check output above)")


if __name__ == '__main__':
    import os
    import sys
    import django

    project_root = str(Path(__file__).resolve().parent.parent)
    sys.path.append(project_root)
    sys.path.append(os.path.join(project_root, 'backend', 'core'))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

    import_data_to_django()
