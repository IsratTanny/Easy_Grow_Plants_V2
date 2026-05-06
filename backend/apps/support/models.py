from django.db import models
from django.conf import settings

class ChatMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_chats')
    message = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='support_images/', blank=True, null=True)
    is_admin_reply = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        role = "Admin" if self.is_admin_reply else self.user.username
        return f"{role}: {self.message[:20]}..."
