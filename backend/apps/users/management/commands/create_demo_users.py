"""
Create the demo accounts used for local testing.

Usage:
    python manage.py create_demo_users
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

DEMO_USERS = [
    # username, password, role, is_staff, is_superuser
    ('Israt Sultana', 'EasyGrow123!', 'buyer', False, False),
    ('admin', 'EasyGrow123!', 'admin', True, True),
    ('EasyGrowOfficial', 'growsecure2024', 'seller', False, False),
]


class Command(BaseCommand):
    help = 'Create/refresh the demo user accounts for local testing.'

    def handle(self, *args, **options):
        for username, password, role, is_staff, is_superuser in DEMO_USERS:
            user, created = User.objects.get_or_create(username=username)
            user.set_password(password)
            if hasattr(user, 'role'):
                user.role = role
            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"{'Created' if created else 'Updated'} {username} (role={role})"
            ))
        self.stdout.write(self.style.SUCCESS('Demo users ready.'))
