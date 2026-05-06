from django.urls import path
from .views import HistoryListView, SendMessageView, AdminTicketsView, AdminUserHistoryView, UnreadNotificationView, MarkNotificationReadView

urlpatterns = [
    path('history/', HistoryListView.as_view(), name='history'),
    path('send/', SendMessageView.as_view(), name='send'),
    path('admin/tickets/', AdminTicketsView.as_view(), name='admin_tickets'),
    path('admin/tickets/<int:user_id>/', AdminUserHistoryView.as_view(), name='admin_user_history'),
    path('notifications/', UnreadNotificationView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark_read'),
]
