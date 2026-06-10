"""
Configuración del panel de administración para el modelo de notificaciones.

Registra NotificationLog como modelo de solo lectura en el admin.
Las notificaciones se crean automáticamente por el sistema (tareas Celery),
por lo que la creación manual está deshabilitada.
"""

from django.contrib import admin
from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """
    Administración del registro de notificaciones.

    Proporciona una vista de solo lectura para monitorizar las
    notificaciones enviadas por el sistema. Permite filtrar por
    tipo, estado y fechas, y buscar por datos del destinatario.

    La creación manual está deshabilitada ya que las notificaciones
    se generan automáticamente vía las señales y tareas de Celery.
    """
    
    # Columnas mostradas en el listado
    list_display = [
        'id',
        'recipient',
        'notification_type',
        'status',
        'sent_at',
        'created_at',
    ]
    # Filtros laterales: tipo de notificación, estado y fechas
    list_filter = ['notification_type', 'status', 'created_at', 'sent_at']
    # Búsqueda por datos del destinatario y asunto del email
    search_fields = [
        'recipient__first_name',
        'recipient__last_name',
        'recipient__email',
        'subject',
    ]
    # Navegación jerárquica por fecha de creación
    date_hierarchy = 'created_at'
    # La fecha de creación no debe poder editarse
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Destinatario y reserva', {
            'fields': ('recipient', 'booking', 'notification_type', 'status')
        }),
        ('Contenido del email', {
            'fields': ('subject', 'message')
        }),
        ('Estado del envío', {
            'fields': ('sent_at', 'error_message')
        }),
        ('Metadatos', {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        """Deshabilita la creación manual. Las notificaciones se generan automáticamente."""
        return False
