"""
Configuración de la app de notificaciones.

Esta aplicación gestiona el envío de notificaciones por email
a los usuarios del sistema. Incluye:
    - Modelo NotificationLog para registrar todas las notificaciones.
    - Tareas asíncronas de Celery para el envío y limpieza.
    - Recordatorios automáticos 24h antes de cada cita.
"""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """Clase de configuración para la app de notificaciones."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Notificaciones'
