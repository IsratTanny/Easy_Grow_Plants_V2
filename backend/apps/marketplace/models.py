from django.db import models
from django.conf import settings

class Plant(models.Model):
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='plants')
    plant_name = models.CharField(max_length=100)
    scientific_name = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    buying_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_quantity = models.IntegerField(default=0)
    image_url = models.ImageField(upload_to='plants/', blank=True, null=True)
    category = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.plant_name

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    
    # Customer Details for Checkout
    customer_name = models.CharField(max_length=150, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Delivery and Payment
    delivery_location = models.CharField(max_length=20, default='inside_dhaka')
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=70.00)
    payment_method = models.CharField(max_length=20, default='cod')

    total_bill = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    tracking_id = models.CharField(max_length=100, blank=True, null=True)
    courier_service = models.CharField(max_length=50, blank=True, null=True)
    payment_status = models.CharField(max_length=20, default='pending') # pending, paid
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Price at time of purchase
    buying_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Cost at time of purchase

    def __str__(self):
        return f"{self.quantity} x {self.plant.plant_name}"

class ShipFastRequest(models.Model):
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pickup_requests')
    request_id = models.CharField(max_length=50, unique=True)
    pickup_address = models.TextField()
    estimated_parcels = models.IntegerField(default=0, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='PENDING')
    service_type = models.CharField(max_length=20, default='Regular')
    rider = models.CharField(max_length=100, default='Unassigned')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shipfast_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Pickup {self.request_id} from {self.seller.username}"

class SellerPaymentMethod(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    provider = models.CharField(max_length=50) # bKash, Nagad, Rocket, Bank
    account_number = models.CharField(max_length=100)
    account_details = models.TextField(blank=True, null=True) # For Bank Name, Branch, etc.
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'seller_payment_methods'

    def save(self, *args, **kwargs):
        if self.is_default:
            SellerPaymentMethod.objects.filter(user=self.user).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.provider} ({self.account_number}) - {self.user.username}"

class PaymentRequest(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, default='PENDING')
    payment_method = models.ForeignKey(SellerPaymentMethod, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_requests'

class ExchangePost(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exchange_posts')
    plant_name = models.CharField(max_length=150)
    health_status = models.CharField(max_length=50) # e.g., Healthy, Needs TLC, Recovering
    looking_for = models.TextField() # What they want in return
    location = models.CharField(max_length=200)
    rarity = models.CharField(max_length=50, blank=True, null=True) # e.g., Common, Rare, Ultra Rare
    plant_type = models.CharField(max_length=100, blank=True, null=True) # e.g., Indoor, Succulent
    image = models.ImageField(upload_to='exchanges/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    status = models.CharField(max_length=20, default='available')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.plant_name} by {self.user.username}"

class ExchangeProposal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    plant = models.ForeignKey(ExchangePost, on_delete=models.CASCADE, related_name='proposals')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_proposals')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_proposals')
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Proposal by {self.sender.username} for {self.plant.plant_name}"

class ExchangeProposalMessage(models.Model):
    proposal = models.ForeignKey(ExchangeProposal, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='exchange_chats/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message by {self.sender.username} on {self.proposal.id}"

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='reviews_written')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews_received')
    plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField(default=5)
    comment = models.TextField()
    image = models.ImageField(upload_to='reviews/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username if self.user else 'Anonymous'} - {self.rating} Stars"

class CartItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart_items')
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s cart: {self.plant.plant_name}"

