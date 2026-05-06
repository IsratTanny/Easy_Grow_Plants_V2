import os
import django
import json
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings') # Try 'settings' instead of 'backend.settings'
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
django.setup()

User = get_user_model()
user = User.objects.get(username='user2')
client = Client()
client.force_login(user)

response = client.get('/api/plant-care/care-cards/')
print(response.content.decode())
