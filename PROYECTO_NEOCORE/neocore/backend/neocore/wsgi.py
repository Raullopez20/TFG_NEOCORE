"""
Configuración WSGI (Web Server Gateway Interface) del proyecto NeoCore.

Este archivo expone la aplicación WSGI como una variable a nivel de módulo
llamada ``application``, que es utilizada por los servidores web compatibles
(como Gunicorn o uWSGI) para servir la aplicación Django en producción.

WSGI es el estándar de Python para la comunicación entre servidores web
y aplicaciones web. Este archivo actúa como puente entre ambos.

Más información:
    https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Se establece el módulo de configuración de Django por defecto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neocore.settings')

# Se crea la aplicación WSGI que será utilizada por el servidor web
application = get_wsgi_application()
