from django.contrib import admin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'is_admin_reply', 'is_read', 'timestamp')
    list_filter = ('is_admin_reply', 'is_read', 'timestamp')
    search_fields = ('user__username', 'message')
