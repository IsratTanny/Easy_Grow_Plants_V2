from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'username', 'message', 'image', 'is_admin_reply', 'is_read', 'timestamp']
        read_only_fields = ['id', 'user', 'is_admin_reply', 'is_read', 'timestamp']
