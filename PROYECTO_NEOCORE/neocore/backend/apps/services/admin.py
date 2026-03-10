"""
Admin configuration for Service model.
"""

from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin for Service model."""
    
    list_display = [
        'name',
        'duration_minutes',
        'price',
        'is_active',
        'available_professionals_count',
        'created_at',
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['professionals']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'image')
        }),
        ('Details', {
            'fields': ('duration_minutes', 'price', 'is_active')
        }),
        ('Professionals', {
            'fields': ('professionals',)
        }),
    )
