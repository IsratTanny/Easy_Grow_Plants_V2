from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order

@receiver(post_save, sender=Order)
def generate_care_cards(sender, instance, created, **kwargs):
    """
    Automatically generates a DynamicCareCard when an order is marked as 'Delivered' or 'Completed'.
    """
    if instance.status in ['delivered', 'completed'] and instance.user:
        try:
            from backend.apps.plant_care.models import DynamicCareCard
            # Extract items from order
            for item in instance.items.all():
                plant = item.plant
                if plant:
                    # Prevent duplicates for the same order and plant
                    if not DynamicCareCard.objects.filter(
                        user=instance.user, 
                        source_order_id=instance.id, 
                        plant_name=plant.plant_name
                    ).exists():
                        DynamicCareCard.objects.create(
                            user=instance.user,
                            plant_name=plant.plant_name,
                            category=plant.category,
                            source_order_id=instance.id
                        )
                        print(f"SUCCESS: Generated Care Card for {plant.plant_name} (Order #{instance.id})")
        except Exception as e:
            # Log error but don't disrupt the main flow
            print(f"ERROR in generate_care_cards: {e}")
