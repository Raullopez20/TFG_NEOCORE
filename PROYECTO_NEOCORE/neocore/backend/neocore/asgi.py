"""
Configuración ASGI (Asynchronous Server Gateway Interface) del proyecto NeoCore.

Este archivo expone la aplicación ASGI como una variable a nivel de módulo
llamada ``application``. ASGI es la evolución asíncrona de WSGI y permite
manejar conexiones WebSocket, HTTP/2 y otras comunicaciones en tiempo real.

Es utilizado por servidores como Daphne o Uvicorn para desplegar
la aplicación Django con soporte asíncrono.

Más información:
    https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

# Se establece el módulo de configuración de Django por defecto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neocore.settings')

# Se crea la aplicación ASGI que será utilizada por el servidor asíncrono
application = get_asgi_application()
