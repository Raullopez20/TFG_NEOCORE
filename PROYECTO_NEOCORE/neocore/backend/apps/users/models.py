"""
User models for NeoCore.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Supports three roles: Client, Professional, and Admin.
    """
    
    class Role(models.TextChoices):
        CLIENT = 'CLIENT', _('Client')
        PROFESSIONAL = 'PROFESSIONAL', _('Professional')
        ADMIN = 'ADMIN', _('Administrator')
    
    # Override username to make it optional
    username = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        null=True,
    )
    
    # Make email the primary identifier
    email = models.EmailField(_('email address'), unique=True)
    
    # Basic info
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    
    # Role
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
    
    # Professional-specific fields
    specialty = models.CharField(
        _('specialty'),
        max_length=100,
        blank=True,
        help_text=_('E.g., Physiotherapy, Nutrition, Personal Training')
    )
    bio = models.TextField(_('biography'), blank=True)
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)
    
    @property
    def is_client(self):
        return self.role == self.Role.CLIENT
    
    @property
    def is_professional(self):
        return self.role == self.Role.PROFESSIONAL
    
    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN
