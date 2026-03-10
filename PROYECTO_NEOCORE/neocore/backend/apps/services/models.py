"""
Models for services and professional associations.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class Service(models.Model):
    """
    Represents a service offered by the wellness center.
    E.g., Physiotherapy Session, Nutrition Consultation, Personal Training.
    """
    
    name = models.CharField(_('name'), max_length=200)
    description = models.TextField(_('description'))
    duration_minutes = models.PositiveIntegerField(
        _('duration (minutes)'),
        help_text=_('Duration of the service in minutes')
    )
    price = models.DecimalField(
        _('price'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Price in EUR (optional for MVP)')
    )
    is_active = models.BooleanField(_('active'), default=True)
    
    # Image for the service
    image = models.ImageField(
        upload_to='services/',
        blank=True,
        null=True,
    )
    
    # Professionals who can provide this service
    professionals = models.ManyToManyField(
        User,
        limit_choices_to={'role': User.Role.PROFESSIONAL},
        related_name='services_offered',
        blank=True,
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('service')
        verbose_name_plural = _('services')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.duration_minutes} min)"
    
    @property
    def available_professionals_count(self):
        """Count of active professionals offering this service."""
        return self.professionals.filter(is_active=True).count()
