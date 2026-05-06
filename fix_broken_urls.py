import os
import sys
import django
from pathlib import Path

project_root = str(Path(__file__).resolve().parent)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.marketplace.models import Plant

# The BOTANICAL_PLACEHOLDER is also broken, so we should change it in the frontend, but here we fix the DB first.
broken_plants = Plant.objects.filter(image_url__icontains='unsplash.com')
print(f"Found {broken_plants.count()} plants with broken Unsplash URLs.")

for plant in broken_plants:
    # We copied all category images into media/plants/ like aglonema.jpg, cactus.jpg, etc.
    cat_slug = plant.category.lower().replace(' ', '')
    # Check if the file exists in media/plants
    image_path = os.path.join(project_root, 'media', 'plants', f"{cat_slug}.jpg")
    
    if os.path.exists(image_path):
        plant.image_url = f"plants/{cat_slug}.jpg"
    else:
        # Fallback to a guaranteed image
        plant.image_url = "plants/monstera.jpg"
    
    plant.save()
    print(f"Fixed {plant.plant_name} -> {plant.image_url}")

print("Done fixing broken URLs.")
