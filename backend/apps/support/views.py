from rest_framework import generics, permissions, status, response, views
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from django.db.models import Max
from django.contrib.auth import get_user_model

User = get_user_model()

class HistoryListView(generics.ListAPIView):
    """
    Fetch full conversation history for the logged-in user.
    Mark all unread admin replies as read when fetching history.
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Update unread admin replies to read
        ChatMessage.objects.filter(user=self.request.user, is_admin_reply=True, is_read=False).update(is_read=True)
        return ChatMessage.objects.filter(user=self.request.user)

class SendMessageView(views.APIView):
    """
    Send message (Check if user.orders.exists() before saving).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Check if user has successfully purchased a product
        # Requirements: user.orders.exists()
        if not request.user.orders.exists():
            return response.Response(
                {"detail": "Only verified customers (those who have made a purchase) can send messages or upload images."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, is_admin_reply=False)
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminTicketsView(views.APIView):
    """
    List all users who have sent messages, for the admin dashboard.
    Shows users and the timestamp of their latest message, plus unread count.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        users_with_messages = ChatMessage.objects.all().values('user').annotate(last_msg=Max('timestamp')).order_by('-last_msg')
        
        result = []
        for item in users_with_messages:
            user = User.objects.get(id=item['user'])
            unread_count = ChatMessage.objects.filter(user=user, is_admin_reply=False, is_read=False).count()
            last_message = ChatMessage.objects.filter(user=user).latest('timestamp')
            result.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': getattr(user, 'full_name', ''), # Safety for custom user field
                'email': user.email,
                'unread_count': unread_count,
                'last_message': last_message.message,
                'last_timestamp': item['last_msg']
            })
        return response.Response(result)

class AdminUserHistoryView(generics.ListAPIView):
    """
    Fetch history for a specific user (Admin context).
    Also allows posting a reply.
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        # Mark user messages as read by admin
        ChatMessage.objects.filter(user_id=user_id, is_admin_reply=False, is_read=False).update(is_read=True)
        return ChatMessage.objects.filter(user_id=user_id)

    def post(self, request, *args, **kwargs):
        user_id = self.kwargs.get('user_id')
        user = User.objects.get(id=user_id)
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user, is_admin_reply=True)
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UnreadNotificationView(views.APIView):
    """
    Check for unread messages (notifications) and return them for the dropdown.
    - Admins see messages from users.
    - Users see replies from admins.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.is_staff: # Admin logic
            unread_qs = ChatMessage.objects.filter(is_admin_reply=False).order_by('-timestamp')
            if request.GET.get('all') != 'true':
                unread_qs = unread_qs.filter(is_read=False)
        else: # Regular Buyer logic
            unread_qs = ChatMessage.objects.filter(user=request.user, is_admin_reply=True).order_by('-timestamp')
            if request.GET.get('all') != 'true':
                unread_qs = unread_qs.filter(is_read=False)

        count = unread_qs.filter(is_read=False).count()
        serializer = ChatMessageSerializer(unread_qs[:50], many=True) # Last 50 for the panel
        
        return response.Response({
            'unread_count': count,
            'notifications': serializer.data
        })

class MarkNotificationReadView(views.APIView):
    """
    Mark a specific notification (message) as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            msg = ChatMessage.objects.get(pk=pk)
            # Only allow the intended recipient to mark as read
            # For admin replies: only the user who the reply belongs to
            # For user messages: any admin/staff
            if msg.is_admin_reply:
                if msg.user != request.user:
                    return response.Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            else:
                if not request.user.is_staff:
                    return response.Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
            msg.is_read = True
            msg.save()
            return response.Response({"status": "success"})
        except ChatMessage.DoesNotExist:
            return response.Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
