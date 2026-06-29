"""
Seed demo content so the site looks populated for a demo/presentation:
nearby sellers (with Dhaka geo-locations + a listing each), community posts,
and plant-exchange posts.

Usage:
    python manage.py seed_demo_data
"""
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

# username, full name, area, latitude, longitude, listing name, image file (in media/plants)
SELLERS = [
    ('green_dhanmondi', 'Nusrat Jahan', 'Dhanmondi, Dhaka', 23.7461, 90.3742, 'Monstera Deliciosa', 'monstera.jpg'),
    ('gulshan_gardens', 'Tanvir Hossain', 'Gulshan, Dhaka', 23.7925, 90.4078, 'Golden Pothos', 'pothos.jpg'),
    ('mirpur_nursery', 'Sadia Rahman', 'Mirpur, Dhaka', 23.8041, 90.3654, 'Snake Plant Laurentii', 'sansevieria.jpg'),
    ('uttara_plants', 'Rakib Chowdhury', 'Uttara, Dhaka', 23.8759, 90.3795, 'Calathea Orbifolia', 'calathea.jpg'),
    ('banani_botanics', 'Farhana Akter', 'Banani, Dhaka', 23.7937, 90.4066, 'Alocasia Polly', 'alocasia.jpg'),
    ('mohammadpur_green', 'Imran Kabir', 'Mohammadpur, Dhaka', 23.7660, 90.3589, 'ZZ Plant', 'zzplant.jpg'),
    ('bashundhara_leaf', 'Tasnia Islam', 'Bashundhara, Dhaka', 23.8103, 90.4370, 'Fiddle Leaf Fig', 'ficus.jpg'),
    ('oldtown_orchids', 'Mahbub Alam', 'Old Dhaka', 23.7104, 90.4074, 'Anthurium Flamingo', 'anthurium.jpg'),
]

# username, full name (for a buyer-style community account)
COMMUNITY_USERS = [
    ('plantmama_dhaka', 'Rima Sultana'),
    ('urban_jungle_bd', 'Sabbir Ahmed'),
    ('leafy_lubna', 'Lubna Karim'),
]

# author username, plant name, caption, image file (served from /images)
POSTS = [
    ('plantmama_dhaka', 'Monstera Deliciosa', 'My monstera finally unfurled a new fenestrated leaf today! 🌿 Two years of patience paying off.', 'monstera.jpg'),
    ('green_dhanmondi', 'Golden Pothos', 'Propagation station update — these pothos cuttings rooted in just 3 weeks in water. Free plants! 💚', 'pothos.jpg'),
    ('urban_jungle_bd', 'Calathea Orbifolia', 'Anyone else struggle with crispy calathea edges? Switched to filtered water and it bounced right back.', 'calathea.jpg'),
    ('leafy_lubna', 'Fittonia Nerve Plant', 'My fittonia does the dramatic faint every afternoon then revives after a drink 😅 such a diva.', 'fittonia.jpg'),
    ('gulshan_gardens', 'Snake Plant', 'PSA: snake plants are basically unkillable. Watered this one once a month all winter and it thrived.', 'sansevieria.jpg'),
    ('mirpur_nursery', 'ZZ Plant', 'Low-light corner of my office, zero fuss, still glossy. The ZZ plant is the MVP of busy people.', 'zzplant.jpg'),
]

# author username, plant, health, looking_for, location, rarity, type, image file
EXCHANGES = [
    ('green_dhanmondi', 'Variegated Monstera Albo Cutting', 'Healthy', 'Philodendron Pink Princess or Anthurium', 'Dhanmondi, Dhaka', 'Ultra Rare', 'Indoor', 'monstera.jpg'),
    ('leafy_lubna', 'Golden Pothos (rooted)', 'Healthy', 'Any Calathea or Maranta', 'Mohakhali, Dhaka', 'Common', 'Indoor', 'pothos.jpg'),
    ('gulshan_gardens', 'Syngonium Albo Variegata', 'Recovering', 'Hoya or String of Hearts', 'Gulshan, Dhaka', 'Rare', 'Indoor', 'syngonium.jpg'),
    ('urban_jungle_bd', 'Snake Plant Pups (x3)', 'Healthy', 'Succulents or a Cactus assortment', 'Mirpur, Dhaka', 'Common', 'Low-light', 'sansevieria.jpg'),
    ('mirpur_nursery', 'Alocasia Black Velvet', 'Needs TLC', 'ZZ Plant or Aglaonema', 'Mirpur, Dhaka', 'Rare', 'Indoor', 'alocasia.jpg'),
]


class Command(BaseCommand):
    help = 'Seed nearby sellers, community posts and exchange posts for demos.'

    def handle(self, *args, **options):
        from backend.apps.marketplace.models import Plant, ExchangePost
        from backend.apps.plant_care.models import Post

        # 1) Sellers with geo + a listing each
        seller_objs = {}
        for username, full_name, area, lat, lon, listing, img in SELLERS:
            u, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@easygrow.com'})
            u.full_name = full_name
            u.address = area
            u.latitude = lat
            u.longitude = lon
            if hasattr(u, 'role'):
                u.role = 'seller'
            u.is_seller = True
            u.bio = f'Trusted plant seller based in {area}.'
            if created:
                u.set_password('EasyGrow123!')
            u.save()
            seller_objs[username] = u
            if not Plant.objects.filter(seller=u, plant_name=listing).exists():
                Plant.objects.create(
                    seller=u, plant_name=listing, category='Indoor', price=random.choice([650, 850, 950, 1200, 1500]),
                    image_url=f'plants/{img}', description='Locally grown, healthy and ready to adopt.',
                    stock_quantity=random.randint(2, 8),
                )
        self.stdout.write(self.style.SUCCESS(f'Sellers ready: {len(SELLERS)} (with geo + listing).'))

        # 2) Community users
        for username, full_name in COMMUNITY_USERS:
            u, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@easygrow.com'})
            u.full_name = full_name
            if created:
                u.set_password('EasyGrow123!')
            u.save()
            seller_objs[username] = u

        # 3) Community posts (idempotent on caption)
        all_users = list(User.objects.all())
        post_count = 0
        for username, plant, caption, img in POSTS:
            author = seller_objs.get(username) or User.objects.filter(username=username).first()
            if not author:
                continue
            if Post.objects.filter(caption=caption).exists():
                continue
            p = Post.objects.create(
                user=author, plant_name=plant, caption=caption,
                image_base64=f'/images/{img}',
            )
            # a few random likes
            for liker in random.sample(all_users, min(len(all_users), random.randint(2, 6))):
                p.likes.add(liker)
            post_count += 1
        self.stdout.write(self.style.SUCCESS(f'Community posts created: {post_count}.'))

        # 4) Exchange posts
        ex_count = 0
        for username, plant, health, want, loc, rarity, ptype, img in EXCHANGES:
            author = seller_objs.get(username) or User.objects.filter(username=username).first()
            if not author:
                continue
            if ExchangePost.objects.filter(plant_name=plant).exists():
                continue
            ExchangePost.objects.create(
                user=author, plant_name=plant, health_status=health, looking_for=want,
                location=loc, rarity=rarity, plant_type=ptype, is_available=True, status='available',
                image=f'plants/{img}',
            )
            ex_count += 1
        self.stdout.write(self.style.SUCCESS(f'Exchange posts created: {ex_count}.'))
