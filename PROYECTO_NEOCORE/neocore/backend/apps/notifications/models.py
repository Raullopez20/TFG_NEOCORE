"""
Models for notification logging.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationLog(models.Model):
    """
    Log of all notifications sent through the system.
    """
    
    class Type(models.TextChoices):
        BOOKING_CREATED = 'BOOKING_CREATED', _('Booking Created')
        BOOKING_CONFIRMED = 'BOOKING_CONFIRMED', _('Booking Confirmed')
        BOOKING_REJECTED = 'BOOKING_REJECTED', _('Booking Rejected')
        BOOKING_CANCELED = 'BOOKING_CANCELED', _('Booking Canceled')
        BOOKING_REMINDER = 'BOOKING_REMINDER', _('Booking Reminder')
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        SENT = 'SENT', _('Sent')
        FAILED = 'FAILED', _('Failed')
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_received',
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
    )
    notification_type = models.CharField(
        max_length=50,
        choices=Type.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    
    # Email details
    subject = models.CharField(max_length=255)
    message = models.TextField()
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('notification log')
        verbose_name_plural = _('notification logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['booking']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.recipient.email} - {self.status}"
