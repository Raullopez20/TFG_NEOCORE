"""
Módulo de inicialización del paquete principal del proyecto NeoCore.

Asegura que la aplicación Celery se importe automáticamente cuando
Django inicie, de modo que las tareas asíncronas definidas con
@shared_task en cualquier app del proyecto se registren correctamente
en el broker de mensajes (Redis).
"""

from .celery import app as celery_app

# Se exporta la instancia de Celery para que esté disponible globalmente
__all__ = ("celery_app",)
