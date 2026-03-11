"""
Configuración de la aplicación 'services' (Servicios) de NeoCore.

Esta app gestiona el catálogo de servicios que ofrece el centro de bienestar,
como sesiones de fisioterapia, consultas nutricionales, entrenamiento personal, etc.
Cada servicio tiene una duración, precio y profesionales asociados que lo imparten.
"""

from django.apps import AppConfig


class ServicesConfig(AppConfig):
    """Clase de configuración de la app de servicios."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.services'
    verbose_name = 'Servicios'
