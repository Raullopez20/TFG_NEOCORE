"""
Models for professional availability and time-off management.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


class AvailabilityRule(models.Model):
    """
    Represents a recurring weekly availability rule for a professional.
    E.g., "Every Monday from 9:00 to 17:00"
    """
    
    DAYS_OF_WEEK = [
        (0, _('Monday')),
        (1, _('Tuesday')),
        (2, _('Wednesday')),
        (3, _('Thursday')),
        (4, _('Friday')),
        (5, _('Saturday')),
        (6, _('Sunday')),
    ]
    
    professional = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Role.PROFESSIONAL},
        related_name='availability_rules',
    )
    day_of_week = models.IntegerField(
        _('day of week'),
        choices=DAYS_OF_WEEK,
    )
    start_time = models.TimeField(_('start time'))
    end_time = models.TimeField(_('end time'))
    is_active = models.BooleanField(_('active'), default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('availability rule')
        verbose_name_plural = _('availability rules')
        ordering = ['professional', 'day_of_week', 'start_time']
        unique_together = ['professional', 'day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.professional.get_full_name()} - {self.get_day_of_week_display()}: {self.start_time}-{self.end_time}"
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError(_('End time must be after start time'))
        
        if not self.professional.is_professional:
            raise ValidationError(_('Availability rules can only be set for professionals'))


class TimeOff(models.Model):
    """
    Represents a specific date or date range when a professional is unavailable.
    E.g., vacation, sick leave, personal day.
    """
    
    professional = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Role.PROFESSIONAL},
        related_name='time_offs',
    )
    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'))
    reason = models.CharField(
        _('reason'),
        max_length=200,
        blank=True,
        help_text=_('Optional reason for time off')
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('time off')
        verbose_name_plural = _('time offs')
        ordering = ['professional', 'start_date']
    
    def __str__(self):
        if self.start_date == self.end_date:
            return f"{self.professional.get_full_name()} - {self.start_date}"
        return f"{self.professional.get_full_name()} - {self.start_date} to {self.end_date}"
    
    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError(_('End date must be after or equal to start date'))
        
        if not self.professional.is_professional:
            raise ValidationError(_('Time off can only be set for professionals'))
