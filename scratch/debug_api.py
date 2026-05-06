import os
import django
import json
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

User = get_user_model()
user = User.objects.get(username='user2')
client = Client()
client.force_login(user)

# Simulate the POST request
print("Simulating watering update for Neon Pothos (ID 9)...")
response = client.post('/api/plant-care/care-cards/9/task_completed/', 
                       data=json.dumps({'task_type': 'water'}), 
                       content_type='application/json')

print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.content.decode()}")
