"""
Configuración de Celery para el proyecto NeoCore.

Celery es un sistema de colas de tareas distribuido que permite ejecutar
tareas de forma asíncrona (en segundo plano). En NeoCore se utiliza
principalmente para:
    - Enviar notificaciones por correo electrónico de forma no bloqueante.
    - Enviar recordatorios automáticos de citas próximas.
    - Limpiar registros de notificaciones antiguas.

Requiere un broker de mensajes (Redis) para funcionar, configurado
en las variables de entorno del proyecto.
"""

import os
from celery import Celery
from celery.schedules import crontab

# Se establece el módulo de configuración de Django por defecto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neocore.settings')

# Se crea la instancia principal de Celery con el nombre del proyecto
app = Celery('neocore')

# Se carga la configuración desde los settings de Django.
# Al usar un string ('django.conf:settings'), el worker no necesita
# serializar el objeto de configuración a los procesos hijos.
# El namespace='CELERY' indica que todas las variables de configuración
# de Celery en settings.py deben tener el prefijo CELERY_ (ej: CELERY_BROKER_URL).
app.config_from_object('django.conf:settings', namespace='CELERY')

# Se descubren automáticamente los módulos tasks.py de todas las apps
# registradas en INSTALLED_APPS de Django.
app.autodiscover_tasks()

# Programación de tareas periódicas con Celery Beat.
# Celery Beat actúa como un planificador (cron) que envía las tareas
# al broker en los intervalos definidos.
app.conf.beat_schedule = {
    # Envía recordatorios por email a los clientes con citas en las próximas 24 horas.
    # Se ejecuta cada hora para verificar si hay citas que necesiten recordatorio.
    'send-booking-reminders': {
        'task': 'apps.notifications.tasks.send_booking_reminders',
        'schedule': crontab(hour='*/1'),
    },
    # Elimina registros de notificaciones con más de 90 días de antigüedad.
    # Se ejecuta diariamente a las 3:00 AM para mantener la base de datos limpia.
    'cleanup-old-notifications': {
        'task': 'apps.notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0),
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """
    Tarea de depuración que imprime los detalles de la petición.
    Útil para verificar que Celery está funcionando correctamente.
    """
    print(f'Request: {self.request!r}')
