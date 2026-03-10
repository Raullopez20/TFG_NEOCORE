"""
Admin configuration for Availability models.
"""

from django.contrib import admin
from .models import AvailabilityRule, TimeOff


@admin.register(AvailabilityRule)
class AvailabilityRuleAdmin(admin.ModelAdmin):
    """Admin for AvailabilityRule model."""
    
    list_display = [
        'professional',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
        'created_at',
    ]
    list_filter = ['day_of_week', 'is_active', 'created_at']
    search_fields = [
        'professional__first_name',
        'professional__last_name',
        'professional__email',
    ]
    
    fieldsets = (
        (None, {
            'fields': ('professional', 'day_of_week')
        }),
        ('Time', {
            'fields': ('start_time', 'end_time', 'is_active')
        }),
    )


@admin.register(TimeOff)
class TimeOffAdmin(admin.ModelAdmin):
    """Admin for TimeOff model."""
    
    list_display = [
        'professional',
        'start_date',
        'end_date',
        'reason',
        'created_at',
    ]
    list_filter = ['start_date', 'end_date', 'created_at']
    search_fields = [
        'professional__first_name',
        'professional__last_name',
        'professional__email',
        'reason',
    ]
    
    fieldsets = (
        (None, {
            'fields': ('professional',)
        }),
        ('Period', {
            'fields': ('start_date', 'end_date', 'reason')
        }),
    )
