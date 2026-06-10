"""
Señales para eventos de reservas.

En Vercel no hay Celery/Redis, por lo que las notificaciones se envían
de forma síncrona directamente desde la señal. Si el email falla,
se registra el error pero NO se cancela la reserva.
"""

import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Booking

logger = logging.getLogger(__name__)


def _notify(booking_id, notification_type, recipient):
    """Envía notificación. Intenta Celery primero; si no hay broker, envía directo."""
    try:
        from apps.notifications.tasks import send_booking_notification
        try:
            send_booking_notification.delay(booking_id, notification_type, recipient)
        except Exception:
            # Celery no disponible (Vercel) → llamada síncrona
            send_booking_notification(booking_id, notification_type, recipient)
    except Exception as exc:
        logger.warning('notification.failed booking=%s type=%s: %s', booking_id, notification_type, exc)


@receiver(pre_save, sender=Booking)
def track_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = Booking.objects.get(pk=instance.pk).status
        except Booking.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Booking)
def handle_booking_created_or_updated(sender, instance, created, **kwargs):
    if created:
        _notify(instance.id, 'booking_created', 'professional')
    else:
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            if instance.status == Booking.Status.CONFIRMED:
                _notify(instance.id, 'booking_confirmed', 'client')
            elif instance.status == Booking.Status.REJECTED:
                _notify(instance.id, 'booking_rejected', 'client')
            elif instance.status == Booking.Status.CANCELED:
                recipient = 'professional' if instance.canceled_by == instance.client else 'client'
                _notify(instance.id, 'booking_canceled', recipient)
