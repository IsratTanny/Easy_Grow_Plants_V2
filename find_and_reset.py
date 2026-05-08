import os
import django
import sys

# Add backend/core to path (matching manage.py logic)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'core'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = "israttanny192@gmail.com"
user = User.objects.filter(email=email).first()

if user:
    print(f"USER_FOUND: {user.username}")
    user.set_password("EasyGrow123!")
    user.save()
    print("PASSWORD_RESET: SUCCESS")
else:
    print("USER_FOUND: NONE")

# Total users count
print(f"TOTAL_USERS: {User.objects.count()}")
