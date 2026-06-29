"""
Seed the marketplace catalog from a CURATED whitelist of plant images.

The bundled image set (frontend/public/images) contains many wrong/blank/
placeholder pictures. This command only uses images that were visually verified
to show a real, correct plant, so every product has an accurate, unique,
professional thumbnail.

Usage:
    python manage.py seed_marketplace
"""
import re
import shutil

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

PREFIX_TO_CATEGORY = {
    'aglaonema': 'Aglonema', 'aglonema': 'Aglonema', 'airplant': 'Air Plant',
    'alocasia': 'Alocasia', 'anthurium': 'Anthurium', 'begonia': 'Begonia',
    'bonsai': 'Bonsai', 'cactus': 'Cactus', 'calathea': 'Calathea',
    'dracaena': 'Dracena', 'dracena': 'Dracena', 'ficus': 'Ficus',
    'fittonia': 'Fittonia', 'monstera': 'Monstera', 'peperomia': 'Peperomia',
    'philodendron': 'Philodendron', 'pothos': 'Pothos', 'sansevieria': 'Sansevieria',
    'succulent': 'Succulent', 'syngonium': 'Syngonium', 'tradescantia': 'Tradescantia',
    'zzplant': 'ZZ Plant',
}

BARE_NAMES = {
    'aglonema': 'Aglaonema Classic', 'airplant': 'Tillandsia Air Plant',
    'anthurium': 'Anthurium Andraeanum', 'bonsai': 'Classic Juniper Bonsai',
    'cactus': 'Mixed Cactus Garden', 'dracena': 'Dracaena Marginata',
    'fittonia': 'Fittonia Nerve Plant', 'syngonium': 'Syngonium Arrowhead',
    'zzplant': 'ZZ Plant (Zamioculcas)', 'monstera': 'Monstera Deliciosa',
    'pothos': 'Golden Pothos', 'alocasia': 'Alocasia Amazonica',
    'calathea': 'Calathea Assorted', 'ficus': 'Ficus Indoor Tree',
    'peperomia': 'Peperomia Assorted', 'philodendron': 'Philodendron Heartleaf',
    'sansevieria': 'Snake Plant', 'succulent': 'Succulent Arrangement',
    'begonia': 'Begonia Assorted',
}

# Curated whitelist (filename stems) — only verified, correct plant photos.
KEEP = {
    # Aglonema (16 of 53 were real plants)
    'aglaonema-first-diamond', 'aglaonema-golden-fluorite', 'aglaonema-harlequin',
    'aglaonema-legacy', 'aglaonema-lotus-delight', 'aglaonema-modestum',
    'aglaonema-red-sunkist', 'aglaonema-red-zircon', 'aglaonema-siam-aurora',
    'aglaonema-silver-bay', 'aglaonema-silver-king', 'aglaonema-silver-queen',
    'aglaonema-stardust', 'aglaonema-suksom-jaiprang', 'aglaonema-white-joy',
    'aglaonema-white-rain', 'aglonema',
    # Monstera (real ones only)
    'monstera-acuminata', 'monstera-adansonii', 'monstera-adansonii-wide-form',
    'monstera-adansonii-albo-variegata', 'monstera-adansonii-aurea-variegata',
    'monstera-deliciosa-borsigiana', 'monstera-deliciosa-compacta',
    'monstera-deliciosa-mint-variegata', 'monstera-deliciosa-thai-constellation',
    'monstera-epipremnoides', 'monstera-lechleriana',
    'monstera-siltepecana', 'monstera-spruceana',
    'monstera-subpinnata', 'monstera-variegata', 'monstera',
    # Pothos (good ones)
    'pothos-cebu-blue', 'pothos-golden', 'pothos-jade',
    'pothos-manjula', 'pothos-shangri-la', 'pothos',
    # Other categories (good ones)
    'airplant', 'alocasia-zebrina', 'alocasia-polly', 'alocasia',
    'anthurium', 'begonia-rex', 'begonia', 'bonsai', 'cactus',
    'calathea', 'calathea-medallion', 'calathea-ornata',
    'dracaena-lemon-lime', 'dracena', 'ficus', 'ficus-elastica', 'fittonia',
    'peperomia', 'peperomia-hope', 'philodendron', 'sansevieria',
    'succulent', 'succulent-jade', 'succulent-echeveria', 'syngonium',
    'tradescantia-nanouk', 'tradescantia-zebrina', 'zzplant',
}

CATEGORY_BASE_PRICE = {
    'Aglonema': 850, 'Air Plant': 350, 'Alocasia': 1100, 'Anthurium': 1300,
    'Begonia': 950, 'Bonsai': 2800, 'Cactus': 500, 'Calathea': 900,
    'Dracena': 800, 'Ficus': 1200, 'Fittonia': 600, 'Monstera': 1500,
    'Peperomia': 700, 'Philodendron': 1400, 'Pothos': 650, 'Sansevieria': 750,
    'Succulent': 450, 'Syngonium': 800, 'ZZ Plant': 1000, 'Tradescantia': 600,
}

IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.avif')


def title_from_filename(stem):
    words = re.split(r'[-_]', stem)
    return ' '.join(w.capitalize() for w in words if w)


class Command(BaseCommand):
    help = 'Seed the marketplace from a curated whitelist of verified plant images.'

    def add_arguments(self, parser):
        parser.add_argument('--keep', action='store_true', help='Append instead of clearing.')

    def handle(self, *args, **options):
        from backend.apps.marketplace.models import Plant

        repo_root = settings.BASE_DIR.parent
        public_images = repo_root / 'frontend' / 'public' / 'images'
        media_plants = settings.MEDIA_ROOT / 'plants'
        media_plants.mkdir(parents=True, exist_ok=True)

        seller, created = User.objects.get_or_create(
            username='EasyGrowOfficial',
            defaults={'email': 'official@easygrow.com', 'full_name': 'Easy Grow Official'},
        )
        if hasattr(seller, 'role'):
            seller.role = 'seller'
        seller.is_seller = True
        if created:
            seller.set_password('growsecure2024')
        seller.save()

        if not options['keep']:
            self.stdout.write(f"Cleared {Plant.objects.all().delete()[0]} existing plants.")

        files = sorted(f for f in public_images.iterdir()
                       if f.is_file() and f.suffix.lower() in IMAGE_EXTS)

        per_cat = {}
        created_count = 0
        for f in files:
            stem = f.stem
            if stem not in KEEP:
                continue
            prefix = re.split(r'[-_.]', stem)[0].lower()
            category = PREFIX_TO_CATEGORY.get(prefix)
            if not category:
                continue
            name = title_from_filename(stem) if ('-' in stem or '_' in stem) else BARE_NAMES.get(prefix, title_from_filename(stem))

            dst = media_plants / f.name
            if not dst.exists():
                shutil.copy2(f, dst)

            idx = per_cat.get(category, 0)
            per_cat[category] = idx + 1
            price = CATEGORY_BASE_PRICE.get(category, 700) + (idx % 8) * 75
            Plant.objects.create(
                seller=seller, plant_name=name, category=category, price=price,
                image_url=f'plants/{f.name}',
                description='Healthy, nursery-grown plant. Comes potted with quality growing media and a care guide.',
                stock_quantity=10,
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {created_count} curated plants across {len(per_cat)} categories.'
        ))
