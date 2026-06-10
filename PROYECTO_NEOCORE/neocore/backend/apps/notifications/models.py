"""
Modelo para el registro (log) de notificaciones enviadas.

Almacena un histórico de todas las notificaciones por email
que se envían a través del sistema, incluyendo:
    - Destinatario y reserva asociada.
    - Tipo de notificación (creada, confirmada, rechazada, etc.).
    - Estado del envío (pendiente, enviada, fallida).
    - Contenido del email (asunto y mensaje).
    - Fecha de envío y mensaje de error en caso de fallo.

Este registro es útil para auditoría, depuración de errores
de envío y análisis del volumen de comunicaciones.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationLog(models.Model):
    """
    Registro de cada notificación enviada por el sistema.

    Cada entrada representa un intento de envío de email,
    ya sea exitoso o fallido. Se crea automáticamente desde
    las tareas de Celery (send_booking_notification, send_booking_reminders).

    Los registros se limpian automáticamente pasados 90 días
    mediante la tarea periódica cleanup_old_notifications.
    """
    
    class Type(models.TextChoices):
        """Tipos de notificación disponibles en el sistema."""
        BOOKING_CREATED = 'BOOKING_CREATED', _('Booking Created')
        BOOKING_CONFIRMED = 'BOOKING_CONFIRMED', _('Booking Confirmed')
        BOOKING_REJECTED = 'BOOKING_REJECTED', _('Booking Rejected')
        BOOKING_CANCELED = 'BOOKING_CANCELED', _('Booking Canceled')
        BOOKING_REMINDER = 'BOOKING_REMINDER', _('Booking Reminder')
    
    class Status(models.TextChoices):
        """Estados posibles de una notificación."""
        PENDING = 'PENDING', _('Pending')    # Creada, pendiente de envío
        SENT = 'SENT', _('Sent')             # Enviada exitosamente
        FAILED = 'FAILED', _('Failed')       # Error en el envío
    
    # Usuario destinatario de la notificación
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_received',
    )
    # Reserva asociada a la notificación (opcional, puede ser null)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
    )
    # Tipo de notificación (creación, confirmación, rechazo, etc.)
    notification_type = models.CharField(
        max_length=50,
        choices=Type.choices,
    )
    # Estado actual del envío
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    
    # =========================================================================
    # Detalles del email
    # =========================================================================
    subject = models.CharField(max_length=255)    # Asunto del email
    message = models.TextField()                   # Cuerpo del email
    sent_at = models.DateTimeField(null=True, blank=True)  # Fecha de envío exitoso
    error_message = models.TextField(blank=True)   # Mensaje de error si falló
    
    # Marca temporal de creación
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('notification log')
        verbose_name_plural = _('notification logs')
        # Mostrar las más recientes primero
        ordering = ['-created_at']
        # Índices para optimizar consultas frecuentes
        indexes = [
            models.Index(fields=['recipient', 'status']),   # Filtrar por destinatario y estado
            models.Index(fields=['booking']),                # Buscar notificaciones de una reserva
            models.Index(fields=['created_at']),             # Ordenar y filtrar por fecha
        ]
    
    def __str__(self):
        """Representación: 'Tipo to email - Estado'."""
        return f"{self.get_notification_type_display()} to {self.recipient.email} - {self.status}"
