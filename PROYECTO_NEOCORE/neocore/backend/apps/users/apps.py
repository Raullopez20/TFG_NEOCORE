"""
Configuración de la aplicación 'users' (Usuarios) de NeoCore.

Esta app gestiona todo lo relacionado con los usuarios del sistema:
    - Modelo de usuario personalizado con roles (Cliente, Profesional, Admin)
    - Autenticación y registro (JWT, Google OAuth)
    - Perfiles de usuario y profesionales
    - Permisos basados en roles
"""

from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Clase de configuración de la app de usuarios."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Usuarios'
