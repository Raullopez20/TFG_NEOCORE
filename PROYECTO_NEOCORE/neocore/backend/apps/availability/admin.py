"""
Configuración del panel de administración para los modelos de disponibilidad.

Registra dos modelos en el admin de Django:
    - AvailabilityRuleAdmin: Gestión de reglas de disponibilidad semanales.
    - TimeOffAdmin: Gestión de períodos de ausencia.
"""

from django.contrib import admin
from .models import AvailabilityRule, TimeOff


@admin.register(AvailabilityRule)
class AvailabilityRuleAdmin(admin.ModelAdmin):
    """
    Administración de reglas de disponibilidad semanal.

    Permite visualizar, filtrar y buscar las reglas de horarios
    de los profesionales. Los fieldsets organizan la información
    en dos secciones: datos del profesional y horario.
    """
    
    # Columnas mostradas en el listado
    list_display = [
        'professional',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
        'created_at',
    ]
    # Filtros laterales: día de la semana, si está activa y fecha de creación
    list_filter = ['day_of_week', 'is_active', 'created_at']
    # Búsqueda por nombre, apellido o email del profesional
    search_fields = [
        'professional__first_name',
        'professional__last_name',
        'professional__email',
    ]
    
    fieldsets = (
        ('Profesional y día', {
            'fields': ('professional', 'day_of_week')
        }),
        ('Horario', {
            'fields': ('start_time', 'end_time', 'is_active')
        }),
    )


@admin.register(TimeOff)
class TimeOffAdmin(admin.ModelAdmin):
    """
    Administración de períodos de ausencia.

    Permite visualizar, filtrar y buscar los períodos de ausencia
    (vacaciones, bajas, días libres) de los profesionales.
    """
    
    # Columnas mostradas en el listado
    list_display = [
        'professional',
        'start_date',
        'end_date',
        'reason',
        'created_at',
    ]
    # Filtros laterales por fechas
    list_filter = ['start_date', 'end_date', 'created_at']
    # Búsqueda por datos del profesional y motivo
    search_fields = [
        'professional__first_name',
        'professional__last_name',
        'professional__email',
        'reason',
    ]
    
    fieldsets = (
        ('Profesional', {
            'fields': ('professional',)
        }),
        ('Período de ausencia', {
            'fields': ('start_date', 'end_date', 'reason')
        }),
    )
