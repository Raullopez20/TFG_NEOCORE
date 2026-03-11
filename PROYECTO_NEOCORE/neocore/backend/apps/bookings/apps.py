"""
Configuración de la aplicación 'bookings' (Reservas) de NeoCore.

Esta app gestiona el sistema completo de reservas de citas entre clientes
y profesionales. Incluye la creación, confirmación, rechazo, cancelación
y finalización de reservas, así como señales para notificaciones automáticas.
"""

from django.apps import AppConfig


class BookingsConfig(AppConfig):
    """Clase de configuración de la app de reservas."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.bookings'
    verbose_name = 'Reservas'
    
    def ready(self):
        """
        Método ejecutado cuando la app está completamente cargada.
        Importa el módulo de señales para registrar los handlers
        que envían notificaciones automáticas cuando cambia el estado
        de una reserva.
        """
        import apps.bookings.signals  # noqa
