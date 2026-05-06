import os
import sys
import django

# Add the project directory to sys.path
sys.path.append(os.getcwd())

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.core.config.settings')
django.setup()

from backend.apps.marketplace.models import Plant
from django.db.models import Count

def summary():
    counts = Plant.objects.values('seller__username').annotate(total=Count('id'))
    print("--- SELLER SUMMARY ---")
    for item in counts:
        print(f"Seller: {item['seller__username']} | Count: {item['total']}")
    print("----------------------")

if __name__ == "__main__":
    summary()
