import os
import sys
import django

# Add paths so Django can find modules
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))
sys.path.insert(0, os.path.join(BASE_DIR, 'backend', 'core'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from backend.apps.marketplace.models import Plant

User = get_user_model()

def update_locations():
    # Update Official Seller (Shahbagh area)
    official = User.objects.filter(username='EasyGrowOfficial').first()
    if official:
        official.latitude = 23.7390
        official.longitude = 90.3957
        official.save()
        print("Updated EasyGrowOfficial location to Shahbagh.")

    # Create/Update Seller 1 (Dhanmondi)
    seller1, created = User.objects.get_or_create(
        username='GreenLeafDhanmondi',
        defaults={
            'email': 'dhanmondi@greenleaf.com', 
            'role': 'seller', 
            'full_name': 'Green Leaf Dhanmondi',
            'latitude': 23.7461,
            'longitude': 90.3742
        }
    )
    if created:
        seller1.set_password('growsecure2024')
        seller1.save()
        print("Created Green Leaf Dhanmondi.")
    else:
        seller1.latitude = 23.7461
        seller1.longitude = 90.3742
        seller1.save()
        print("Updated Green Leaf Dhanmondi location.")

    # Create/Update Seller 2 (Banani)
    seller2, created = User.objects.get_or_create(
        username='PlantCornerBanani',
        defaults={
            'email': 'banani@plantcorner.com', 
            'role': 'seller', 
            'full_name': 'Plant Corner Banani',
            'latitude': 23.7940,
            'longitude': 90.4043
        }
    )
    if created:
        seller2.set_password('growsecure2024')
        seller2.save()
        print("Created Plant Corner Banani.")
    else:
        seller2.latitude = 23.7940
        seller2.longitude = 90.4043
        seller2.save()
        print("Updated Plant Corner Banani location.")

    # Create/Update Seller 3 (Mirpur)
    seller3, created = User.objects.get_or_create(
        username='MirpurNursery',
        defaults={
            'email': 'mirpur@nursery.com', 
            'role': 'seller', 
            'full_name': 'Mirpur Garden Nursery',
            'latitude': 23.8223,
            'longitude': 90.3654
        }
    )
    if created:
        seller3.set_password('growsecure2024')
        seller3.save()
        print("Created Mirpur Garden Nursery.")
    else:
        seller3.latitude = 23.8223
        seller3.longitude = 90.3654
        seller3.save()
        print("Updated Mirpur Garden Nursery location.")

    # Add a few plants to new sellers so they show up in results
    if created:
        Plant.objects.create(
            plant_name="Rare Monstera Variegata",
            category="Monstera",
            price=15000,
            image_url="https://images.unsplash.com/photo-1614594975525-e45190c55d0b",
            description="Ultra rare variegation, with pot Media",
            seller=seller1,
            stock_quantity=1
        )
        Plant.objects.create(
            plant_name="Healthy Snake Plant",
            category="Sansevieria",
            price=1200,
            image_url="https://images.unsplash.com/photo-1599598425947-5202ed56bc9a",
            description="Air purifying, with pot Media",
            seller=seller2,
            stock_quantity=5
        )
        print("Added sample plants to new sellers.")

if __name__ == '__main__':
    update_locations()
