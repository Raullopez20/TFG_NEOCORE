"""
Configuración de la app de disponibilidad (availability).

Esta aplicación gestiona todo lo relacionado con la disponibilidad
horaria de los profesionales:
    - Reglas de disponibilidad semanal recurrente (AvailabilityRule).
    - Períodos de ausencia o vacaciones (TimeOff).
    - Generación de slots disponibles para reserva.
"""

from django.apps import AppConfig


class AvailabilityConfig(AppConfig):
    """Clase de configuración para la app de disponibilidad."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.availability'
    verbose_name = 'Disponibilidad'
