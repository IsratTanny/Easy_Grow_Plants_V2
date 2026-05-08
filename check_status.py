import os
import django
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = "israttanny192@gmail.com"
user = User.objects.filter(email=email).first()

if user:
    print(f"USERNAME: {user.username}")
    print(f"ROLE: {user.role}")
    print(f"DJANGO_VERIFIED: {user.is_verified}")
    # Mark as verified in Django to help with the bypass logic
    user.is_verified = True
    user.save()
    print("DJANGO_VERIFIED set to True")
else:
    print("USER NOT FOUND")
