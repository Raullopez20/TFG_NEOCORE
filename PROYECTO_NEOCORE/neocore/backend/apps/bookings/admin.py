"""
Admin configuration for Booking model.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Admin for Booking model."""
    
    list_display = [
        'id',
        'client',
        'professional',
        'service',
        'start_datetime',
        'status_badge',
        'created_at',
    ]
    list_filter = ['status', 'service', 'professional', 'created_at', 'start_datetime']
    search_fields = [
        'client__first_name',
        'client__last_name',
        'client__email',
        'professional__first_name',
        'professional__last_name',
        'professional__email',
        'service__name',
    ]
    date_hierarchy = 'start_datetime'
    
    fieldsets = (
        ('Participants', {
            'fields': ('client', 'professional', 'service')
        }),
        ('Schedule', {
            'fields': ('start_datetime', 'end_datetime', 'status')
        }),
        ('Notes', {
            'fields': ('client_notes', 'professional_notes')
        }),
        ('Cancellation', {
            'fields': ('cancellation_reason', 'canceled_by', 'canceled_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('reminder_sent', 'reminder_sent_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def status_badge(self, obj):
        """Display status as colored badge."""
        colors = {
            'PENDING': '#ffc107',
            'CONFIRMED': '#28a745',
            'REJECTED': '#dc3545',
            'CANCELED': '#6c757d',
            'DONE': '#007bff',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    actions = ['mark_as_confirmed', 'mark_as_done', 'mark_as_canceled']
    
    def mark_as_confirmed(self, request, queryset):
        updated = queryset.filter(status=Booking.Status.PENDING).update(
            status=Booking.Status.CONFIRMED
        )
        self.message_user(request, f'{updated} bookings marked as confirmed.')
    mark_as_confirmed.short_description = 'Mark selected as Confirmed'
    
    def mark_as_done(self, request, queryset):
        updated = queryset.filter(status=Booking.Status.CONFIRMED).update(
            status=Booking.Status.DONE
        )
        self.message_user(request, f'{updated} bookings marked as done.')
    mark_as_done.short_description = 'Mark selected as Done'
    
    def mark_as_canceled(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED]
        ).update(
            status=Booking.Status.CANCELED,
            canceled_by=request.user,
            canceled_at=timezone.now()
        )
        self.message_user(request, f'{updated} bookings marked as canceled.')
    mark_as_canceled.short_description = 'Mark selected as Canceled'
