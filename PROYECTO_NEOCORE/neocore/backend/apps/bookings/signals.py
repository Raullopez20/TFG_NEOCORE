"""
Signals for booking-related events.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Booking
from apps.notifications.tasks import send_booking_notification


@receiver(pre_save, sender=Booking)
def track_status_change(sender, instance, **kwargs):
    """Track status changes to trigger appropriate notifications."""
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
    Send notifications when booking is created or status changes.
    """
    if created:
        # New booking created - notify professional
        send_booking_notification.delay(
            booking_id=instance.id,
            notification_type='booking_created',
            recipient='professional'
        )
    else:
        # Status changed
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            # Notify based on new status
            if instance.status == Booking.Status.CONFIRMED:
                # Notify client that booking was confirmed
                send_booking_notification.delay(
                    booking_id=instance.id,
                    notification_type='booking_confirmed',
                    recipient='client'
                )
            elif instance.status == Booking.Status.REJECTED:
                # Notify client that booking was rejected
                send_booking_notification.delay(
                    booking_id=instance.id,
                    notification_type='booking_rejected',
                    recipient='client'
                )
            elif instance.status == Booking.Status.CANCELED:
                # Notify both parties
                if instance.canceled_by == instance.client:
                    # Client canceled - notify professional
                    send_booking_notification.delay(
                        booking_id=instance.id,
                        notification_type='booking_canceled',
                        recipient='professional'
                    )
                else:
                    # Professional canceled - notify client
                    send_booking_notification.delay(
                        booking_id=instance.id,
                        notification_type='booking_canceled',
                        recipient='client'
                    )
