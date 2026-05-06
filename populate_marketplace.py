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

from backend.apps.marketplace.models import Plant
from django.contrib.auth import get_user_model

User = get_user_model()

def populate():
    # Ensure a seller exists
    seller, created = User.objects.get_or_create(
        username='EasyGrowOfficial',
        defaults={'email': 'official@easygrow.com', 'role': 'seller', 'full_name': 'Easy Grow Official'}
    )
    if created:
        seller.set_password('growsecure2024')
        seller.save()

    plants_data = [
        # Aglonema
        {"name": "Aglonema Red Valentine", "category": "Aglonema", "price": 850, "image": "https://images.unsplash.com/photo-1637418701047-063854199c0d?q=80&w=800&auto=format&fit=crop"},
        {"name": "Aglonema Silver Bay", "category": "Aglonema", "price": 750, "image": "https://images.unsplash.com/photo-1620120966883-d977b59a96ec?q=80&w=800&auto=format&fit=crop"},
        # Alocasia
        {"name": "Alocasia Polly", "category": "Alocasia", "price": 950, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        {"name": "Alocasia Black Velvet", "category": "Alocasia", "price": 1100, "image": "https://images.unsplash.com/photo-1616690710400-a16d146927c5?q=80&w=800&auto=format&fit=crop"},
        # Anthurium
        {"name": "Anthurium Flamingo Flower", "category": "Anthurium", "price": 1200, "image": "https://images.unsplash.com/photo-1594589999052-cd120349890f?q=80&w=800&auto=format&fit=crop"},
        {"name": "Anthurium Clarinervium", "category": "Anthurium", "price": 2500, "image": "https://images.unsplash.com/photo-1618060932014-4eb9c9ffc696?q=80&w=800&auto=format&fit=crop"},
        # Begonia
        {"name": "Begonia Maculata", "category": "Begonia", "price": 980, "image": "https://images.unsplash.com/photo-1623910385759-f2ec5103aada?q=80&w=800&auto=format&fit=crop"},
        {"name": "Begonia Rex", "category": "Begonia", "price": 850, "image": "https://images.unsplash.com/photo-1593433553229-397a6e709033?q=80&w=800&auto=format&fit=crop"},
        # Bonsai
        {"name": "Juniper Bonsai Master", "category": "Bonsai", "price": 4500, "image": "https://images.unsplash.com/photo-1599598425947-5202ed56bc9a?q=80&w=800&auto=format&fit=crop"},
        {"name": "Ficus Ginseng Bonsai", "category": "Bonsai", "price": 3200, "image": "https://images.unsplash.com/photo-1582268393321-729ce45995b0?q=80&w=800&auto=format&fit=crop"},
        # Cactus
        {"name": "Golden Barrel Cactus", "category": "Cactus", "price": 550, "image": "https://images.unsplash.com/photo-1520302630591-fd1c66ed8181?q=80&w=800&auto=format&fit=crop"},
        {"name": "Moon Cactus Pink", "category": "Cactus", "price": 450, "image": "https://images.unsplash.com/photo-1508713181732-ee29a68793d5?q=80&w=800&auto=format&fit=crop"},
        # Calathea
        {"name": "Calathea Medallion", "category": "Calathea", "price": 850, "image": "https://images.unsplash.com/photo-1624515513511-64562c199042?q=80&w=800&auto=format&fit=crop"},
        {"name": "Calathea Orbifolia", "category": "Calathea", "price": 1200, "image": "https://images.unsplash.com/photo-1632767035540-8f92f96cf938?q=80&w=800&auto=format&fit=crop"},
        # Dracena
        {"name": "Dracena Marginata", "category": "Dracena", "price": 1500, "image": "https://images.unsplash.com/photo-1599598177991-ec774ca4f808?q=80&w=800&auto=format&fit=crop"},
        {"name": "Dracena Lemon Lime", "category": "Dracena", "price": 1100, "image": "https://images.unsplash.com/photo-1634840882200-e26090f77bc5?q=80&w=800&auto=format&fit=crop"},
        # Ficus
        {"name": "Fiddle Leaf Fig", "category": "Ficus", "price": 2800, "image": "https://images.unsplash.com/photo-1597055181300-e36caf3b2977?q=80&w=800&auto=format&fit=crop"},
        {"name": "Ficus Tineke", "category": "Ficus", "price": 1600, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        # Fittonia
        {"name": "Nerve Plant Red", "category": "Fittonia", "price": 450, "image": "https://images.unsplash.com/photo-1550948390-6eb7fa773072?q=80&w=800&auto=format&fit=crop"},
        {"name": "Nerve Plant White", "category": "Fittonia", "price": 450, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        # Monstera
        {"name": "Monstera Adansonii", "category": "Monstera", "price": 650, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        {"name": "Monstera Deliciosa", "category": "Monstera", "price": 1500, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        # Peperomia
        {"name": "Watermelon Peperomia", "category": "Peperomia", "price": 750, "image": "https://images.unsplash.com/photo-1632767035540-8f92f96cf938?q=80&w=800&auto=format&fit=crop"},
        {"name": "Peperomia Hope", "category": "Peperomia", "price": 550, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        # Philodendron
        {"name": "Philodendron Pink Princess", "category": "Philodendron", "price": 4500, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        {"name": "Philodendron Birkin", "category": "Philodendron", "price": 1200, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        # Pothos
        {"name": "N'Joy Pothos", "category": "Pothos", "price": 350, "image": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?q=80&w=800&auto=format&fit=crop"},
        {"name": "Golden Pothos", "category": "Pothos", "price": 250, "image": "https://images.unsplash.com/photo-1599598177991-ec774ca4f808?q=80&w=800&auto=format&fit=crop"},
        # Sansevieria
        {"name": "Sansevieria Moonshine", "category": "Sansevieria", "price": 1500, "image": "https://images.unsplash.com/photo-1592395550275-3882a1762cfb?q=80&w=800&auto=format&fit=crop"},
        {"name": "Snake Plant Laurentii", "category": "Sansevieria", "price": 950, "image": "https://images.unsplash.com/photo-1599598425947-5202ed56bc9a?q=80&w=800&auto=format&fit=crop"},
        # Succulent
        {"name": "Echeveria Blue", "category": "Succulent", "price": 350, "image": "https://images.unsplash.com/photo-1509423350716-97f9360b4eaf?q=80&w=800&auto=format&fit=crop"},
        {"name": "Haworthia Zebra", "category": "Succulent", "price": 250, "image": "https://images.unsplash.com/photo-1528643354326-c567a147e45e?q=80&w=800&auto=format&fit=crop"},
        # Syngonium
        {"name": "Syngonium Neon Robusta", "category": "Syngonium", "price": 550, "image": "https://images.unsplash.com/photo-1604762524889-3e2fcc145683?q=80&w=800&auto=format&fit=crop"},
        {"name": "Syngonium Albo", "category": "Syngonium", "price": 2200, "image": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=800&auto=format&fit=crop"},
        # ZZ Plant
        {"name": "ZZ Raven", "category": "ZZ Plant", "price": 1800, "image": "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?q=80&w=800&auto=format&fit=crop"},
        {"name": "ZZ Zamifolia", "category": "ZZ Plant", "price": 950, "image": "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?q=80&w=800&auto=format&fit=crop"},
        # Air Plant
        {"name": "Tillandsia Xerographica", "category": "Air Plant", "price": 1200, "image": "https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=800&auto=format&fit=crop"},
        {"name": "Tillandsia Ionantha", "category": "Air Plant", "price": 350, "image": "https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=800&auto=format&fit=crop"},
    ]

    Plant.objects.all().delete()
    print("Marketplace cleared.")

    for data in plants_data:
        Plant.objects.create(
            plant_name=data['name'],
            category=data['category'],
            price=data['price'],
            image_url=data['image'],
            description="With pot Media",
            seller=seller,
            stock_quantity=10
        )
        print(f"Added {data['name']} to category {data['category']}")

if __name__ == '__main__':
    populate()
    print("\nMarketplace successfully populated with all 19 functional categories!")
    print("Design: 'NEW ARRIVAL' badge, Taka (৳) pricing, and 'With pot Media' descriptions active.")
