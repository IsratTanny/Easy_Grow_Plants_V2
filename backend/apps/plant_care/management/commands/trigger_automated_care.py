from django.core.management.base import BaseCommand
from django.utils import timezone
from backend.apps.plant_care.models import DynamicCareCard, CareTemplate, Notification
import datetime

class Command(BaseCommand):
    help = 'Triggers automated care notifications for active DynamicCareCards based on category templates'

    def handle(self, *args, **kwargs):
        cards = DynamicCareCard.objects.all()
        today = timezone.now().date()
        count = 0
        
        for card in cards:
            template = CareTemplate.objects.filter(category__iexact=card.category).first()
            if not template:
                water_int = card.watering_frequency or 7
                fert_int = card.fertilizer_frequency or 30
                repot_int = 12
            else:
                water_int = card.watering_frequency or template.watering_interval_days
                fert_int = card.fertilizer_frequency or template.fertilizer_interval_days
                repot_int = template.repotting_interval_months

            need_water = (today - card.last_watered_date).days >= water_int
            need_fert = (today - card.last_fertilized_date).days >= fert_int
            need_repot = ((today.year - card.last_repotting_date.year) * 12 + today.month - card.last_repotting_date.month) >= repot_int

            messages = []
            if "neon pothos" in card.plant_name.lower():
                if need_water or need_fert:
                    messages.append(f"It's time to care for your Neon Pothos!")
            else:
                if need_water:
                    messages.append(f"It's time to water your {card.plant_name}!")
                if need_fert:
                    messages.append(f"It's time to fertilize your {card.plant_name}!")
            
            if need_repot:
                messages.append(f"Your {card.plant_name} might be outgrowing its pot. Time for repotting!")

            for msg in messages:
                # To avoid duplicate notifications on same day, check if one already exists
                if not Notification.objects.filter(user=card.user, message=msg, created_at__date=today).exists():
                    Notification.objects.create(
                        user=card.user,
                        message=msg
                    )
                    count += 1
                    self.stdout.write(self.style.SUCCESS(f'Notification generated for {card.user.username}: {msg}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully processed all Care Cards. Generated {count} notifications.'))
