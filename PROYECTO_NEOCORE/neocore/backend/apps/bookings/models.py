"""
Models for booking management.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()


class Booking(models.Model):
    """
    Represents a booking/appointment between a client and professional.
    """
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        CONFIRMED = 'CONFIRMED', _('Confirmed')
        REJECTED = 'REJECTED', _('Rejected')
        CANCELED = 'CANCELED', _('Canceled')
        DONE = 'DONE', _('Done')
    
    # Participants
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings_as_client',
        limit_choices_to={'role': User.Role.CLIENT},
    )
    professional = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings_as_professional',
        limit_choices_to={'role': User.Role.PROFESSIONAL},
    )
    
    # Service
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    
    # Timing
    start_datetime = models.DateTimeField(_('start date/time'))
    end_datetime = models.DateTimeField(_('end date/time'))
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    
    # Additional info
    client_notes = models.TextField(
        _('client notes'),
        blank=True,
        help_text=_('Notes from client to professional')
    )
    professional_notes = models.TextField(
        _('professional notes'),
        blank=True,
        help_text=_('Internal notes by professional')
    )
    
    # Cancellation/rejection
    cancellation_reason = models.TextField(
        _('cancellation reason'),
        blank=True,
    )
    canceled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings_canceled',
    )
    canceled_at = models.DateTimeField(null=True, blank=True)
    
    # Reminder sent
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('booking')
        verbose_name_plural = _('bookings')
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['professional', 'status']),
            models.Index(fields=['start_datetime']),
            models.Index(fields=['status', 'start_datetime']),
        ]
    
    def __str__(self):
        return f"{self.client.get_full_name()} → {self.professional.get_full_name()} | {self.service.name} | {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"
    
    def clean(self):
        # Validate that start is before end
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError(_('End time must be after start time'))
        
        # Validate that client is actually a client
        if self.client and not self.client.is_client:
            raise ValidationError(_('Client must have CLIENT role'))
        
        # Validate that professional is actually a professional
        if self.professional and not self.professional.is_professional:
            raise ValidationError(_('Professional must have PROFESSIONAL role'))
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def duration_minutes(self):
        """Calculate duration in minutes."""
        if self.start_datetime and self.end_datetime:
            delta = self.end_datetime - self.start_datetime
            return int(delta.total_seconds() / 60)
        return 0
    
    @property
    def is_past(self):
        """Check if booking is in the past."""
        return self.end_datetime < timezone.now()
    
    @property
    def is_upcoming(self):
        """Check if booking is upcoming (confirmed and in future)."""
        return (
            self.status == self.Status.CONFIRMED and
            self.start_datetime > timezone.now()
        )
    
    def can_be_canceled(self):
        """Check if booking can be canceled."""
        return self.status in [self.Status.PENDING, self.Status.CONFIRMED]
    
    def can_be_confirmed(self):
        """Check if booking can be confirmed."""
        return self.status == self.Status.PENDING
    
    def can_be_rejected(self):
        """Check if booking can be rejected."""
        return self.status == self.Status.PENDING
