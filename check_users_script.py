import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.core.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("--- Checking Users ---")
count = User.objects.count()
print(f"Total Registered Users: {count}")

print("--- Users List ---")
for u in User.objects.all():
    print(f"Username: {u.username}, Email: {u.email}")

print("--- Finding User ---")
email = "israttanny192@gmail.com"
try:
    user = User.objects.get(email=email)
    print(f"FOUND USERNAME: {user.username}")
    print(f"FOUND EMAIL: {user.email}")
    user.set_password("EasyGrow123!")
    user.save()
    print("Password reset successfully to: EasyGrow123!")
except User.DoesNotExist:
    print(f"User with email {email} does not exist in Django DB.")
except User.MultipleObjectsReturned:
    print(f"Multiple users found with email {email}.")
    users = User.objects.filter(email=email)
    for u in users:
        print(f"Username: {u.username}")
