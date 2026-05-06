import os
import django
import json
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import sys
sys.path.append(os.getcwd())
django.setup()

client = Client()
response = client.get('/api/reviews/')
print(f"Status: {response.status_code}")
print(f"Body: {response.content.decode()}")
