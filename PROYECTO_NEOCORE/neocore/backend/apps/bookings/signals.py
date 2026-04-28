"""
Señales (signals) para eventos relacionados con las reservas.

Define handlers que se ejecutan automáticamente cuando se crea o
actualiza una reserva, permitiendo enviar notificaciones por email
a los participantes según el tipo de evento:

    - Reserva creada: se notifica al profesional.
    - Reserva confirmada: se notifica al cliente.
    - Reserva rechazada: se notifica al cliente.
    - Reserva cancelada: se notifica a la otra parte (según quién cancela).

Las notificaciones se envían de forma asíncrona mediante tareas de Celery
para no bloquear la respuesta HTTP al usuario.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Booking
from apps.notifications.tasks import send_booking_notification


@receiver(pre_save, sender=Booking)
def track_status_change(sender, instance, **kwargs):
    """
    Se ejecuta ANTES de guardar una reserva.

    Almacena el estado anterior de la reserva en un atributo temporal
    (_old_status) para poder compararlo después del guardado y detectar
    cambios de estado que requieran notificación.
    """
    if instance.pk:
        try:
            old_instance = Booking.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Booking.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Booking)
def handle_booking_created_or_updated(sender, instance, created, **kwargs):
    """
    Se ejecuta DESPUÉS de guardar una reserva.

    Envía notificaciones por email según el evento:
        - Si es una nueva reserva: notifica al profesional de la nueva solicitud.
        - Si cambió el estado:
            - CONFIRMED: notifica al cliente que su reserva fue aceptada.
            - REJECTED: notifica al cliente que su reserva fue rechazada.
            - CANCELED: notifica a la parte contraria de la cancelación.

    Las notificaciones se encolan en Celery (.delay()) para procesarse
    en segundo plano sin afectar el tiempo de respuesta de la API.
    """
    import logging
    _log = logging.getLogger(__name__)

    def _notify(notification_type, recipient):
        try:
            send_booking_notification.delay(
                booking_id=instance.id,
                notification_type=notification_type,
                recipient=recipient,
            )
        except Exception as exc:
            _log.warning('Celery task dispatch failed (booking %s): %s', instance.id, exc)

    if created:
        # Nueva reserva creada -> notificar al profesional
        _notify('booking_created', 'professional')
    else:
        # Verificar si hubo un cambio de estado
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            if instance.status == Booking.Status.CONFIRMED:
                _notify('booking_confirmed', 'client')
            elif instance.status == Booking.Status.REJECTED:
                _notify('booking_rejected', 'client')
            elif instance.status == Booking.Status.CANCELED:
                if instance.canceled_by == instance.client:
                    _notify('booking_canceled', 'professional')
                else:
                    _notify('booking_canceled', 'client')
