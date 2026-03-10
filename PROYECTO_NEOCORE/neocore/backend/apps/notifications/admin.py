"""
Admin configuration for Notification models.
"""

from django.contrib import admin
from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """Admin for NotificationLog model."""
    
    list_display = [
        'id',
        'recipient',
        'notification_type',
        'status',
        'sent_at',
        'created_at',
    ]
    list_filter = ['notification_type', 'status', 'created_at', 'sent_at']
    search_fields = [
        'recipient__first_name',
        'recipient__last_name',
        'recipient__email',
        'subject',
    ]
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']
    
    fieldsets = (
        (None, {
            'fields': ('recipient', 'booking', 'notification_type', 'status')
        }),
        ('Email Content', {
            'fields': ('subject', 'message')
        }),
        ('Status', {
            'fields': ('sent_at', 'error_message')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        # Notifications are created automatically, not manually
        return False
