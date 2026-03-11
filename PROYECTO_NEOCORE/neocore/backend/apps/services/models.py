"""
Modelos para la gestión de servicios y sus asociaciones con profesionales.

Define el modelo Service que representa cada tipo de servicio ofrecido
por el centro de bienestar. Cada servicio se puede vincular a uno o varios
profesionales que estén capacitados para impartirlo, mediante una relación
ManyToMany.

Ejemplos de servicios:
    - Sesión de Fisioterapia (60 min, 45€)
    - Consulta Nutricional (45 min, 50€)
    - Entrenamiento Personal (60 min, 40€)
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class Service(models.Model):
    """
    Modelo que representa un servicio ofrecido por el centro de bienestar.

    Cada servicio tiene un nombre, descripción, duración en minutos,
    precio opcional y una lista de profesionales que lo pueden impartir.
    Incluye una imagen representativa y un indicador de estado activo/inactivo.
    """
    
    # Información básica del servicio
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
    # Indica si el servicio está disponible para reservas
    is_active = models.BooleanField(_('active'), default=True)
    
    # Imagen representativa del servicio (para el catálogo del frontend)
    image = models.ImageField(
        upload_to='services/',
        blank=True,
        null=True,
    )
    
    # Relación ManyToMany con los profesionales que pueden impartir este servicio.
    # Solo se permiten usuarios con rol PROFESSIONAL mediante limit_choices_to.
    professionals = models.ManyToManyField(
        User,
        limit_choices_to={'role': User.Role.PROFESSIONAL},
        related_name='services_offered',
        blank=True,
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('service')
        verbose_name_plural = _('services')
        ordering = ['name']  # Orden alfabético por nombre
    
    def __str__(self):
        """Representación en texto: nombre del servicio y duración."""
        return f"{self.name} ({self.duration_minutes} min)"
    
    @property
    def available_professionals_count(self):
        """Cuenta el número de profesionales activos que ofrecen este servicio."""
        return self.professionals.filter(is_active=True).count()
