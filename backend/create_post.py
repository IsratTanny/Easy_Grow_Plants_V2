import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.config.settings')
django.setup()

from apps.plant_care.models import Post
from apps.users.models import CustomUser

admin = CustomUser.objects.filter(is_superuser=True).first()
if admin:
    if not Post.objects.exists():
        Post.objects.create(
            user=admin,
            plant_name='Monstera Deliciosa (Demo)',
            caption='Welcome tracking the community garden! Share a beautiful picture of your flourishing leaves below.',
            image_base64='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMzZjg5NjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QbGFudCBDb21tdW5pdHk8L3RleHQ+PC9zdmc+'
        )
        print("Created demo post.")
    else:
        print("Posts exist.")
else:
    print("No admin user found to associate post.")
