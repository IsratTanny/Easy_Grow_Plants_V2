import os
import sys
import django

# Add the project directory to sys.path
sys.path.append(os.getcwd())

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.core.config.settings')
django.setup()

from backend.apps.marketplace.models import Plant
from backend.apps.marketplace.serializers import PlantSerializer

def check_plants():
    queryset = Plant.objects.all()
    serializer = PlantSerializer(queryset, many=True)
    print(f"DEBUG: TOTAL PLANTS IN DB: {queryset.count()}")
    for d in serializer.data:
        print(f"NAME: {d['name']} | SELLER: {d['seller_username']}")

if __name__ == "__main__":
    check_plants()
