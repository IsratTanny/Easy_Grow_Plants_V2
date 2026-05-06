from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.plant_care.models import Subscription, Notification

class Command(BaseCommand):
    help = 'Triggers notifications for upcoming plant care kit deliveries'

    def handle(self, *args, **kwargs):
        # Find active subscriptions where next_delivery_date is within 7 days
        seven_days_from_now = timezone.now() + timedelta(days=7)
        upcoming_deliveries = Subscription.objects.filter(
            is_active=True,
            next_delivery_date__lte=seven_days_from_now,
            next_delivery_date__gte=timezone.now()
        )

        for sub in upcoming_deliveries:
            # Create notification
            Notification.objects.create(
                user=sub.user,
                message="Your next plant care kit is being prepared and will be sent to your address soon!"
            )
            # Update next_delivery_date to simulate the next cycle (usually 3 months later)
            # For demonstration, we just log it
            self.stdout.write(self.style.SUCCESS(f'Notification sent to {sub.user.username}'))
