"""
Configuración del panel de administración para el modelo de Servicio.

Personaliza la interfaz del admin de Django para facilitar la gestión
del catálogo de servicios, incluyendo la asignación de profesionales
mediante un widget de selección horizontal.
"""

from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """
    Configuración del admin para el modelo Service.

    Permite gestionar los servicios del centro con filtros por estado,
    búsqueda por nombre/descripción, y asignación visual de profesionales
    mediante un widget de selección horizontal (filter_horizontal).
    """
    
    # Columnas visibles en el listado
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
    # Widget de selección horizontal para asignar profesionales al servicio
    filter_horizontal = ['professionals']
    
    # Agrupación de campos en secciones lógicas
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'image')
        }),
        ('Detalles', {
            'fields': ('duration_minutes', 'price', 'is_active')
        }),
        ('Profesionales asignados', {
            'fields': ('professionals',)
        }),
    )
