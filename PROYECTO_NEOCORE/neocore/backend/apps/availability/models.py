"""
Modelos para la gestión de disponibilidad y ausencias de profesionales.

Contiene dos modelos principales:
    - AvailabilityRule: Reglas de disponibilidad semanal recurrente.
      Define en qué días y horarios un profesional acepta citas.
      Ejemplo: "Lunes de 09:00 a 17:00".

    - TimeOff: Períodos de ausencia específicos.
      Define rangos de fechas en los que el profesional no está disponible.
      Ejemplo: vacaciones, baja médica, día personal.

Estos modelos se combinan en AvailabilityService para calcular los
slots disponibles para reserva en tiempo real.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


class AvailabilityRule(models.Model):
    """
    Regla de disponibilidad semanal recurrente de un profesional.

    Cada regla define un bloque horario disponible para un día específico
    de la semana. Un profesional puede tener múltiples reglas para
    cubrir diferentes días u horarios (mañana y tarde, por ejemplo).

    La combinación (professional, day_of_week, start_time) es única
    para evitar reglas duplicadas en el mismo horario.

    Ejemplo: "María Gómez - Lunes: 09:00-14:00"
    """
    
    # Mapeo de días de la semana (0=Lunes ... 6=Domingo, estándar ISO)
    DAYS_OF_WEEK = [
        (0, _('Monday')),
        (1, _('Tuesday')),
        (2, _('Wednesday')),
        (3, _('Thursday')),
        (4, _('Friday')),
        (5, _('Saturday')),
        (6, _('Sunday')),
    ]
    
    # Profesional al que pertenece la regla (solo usuarios con rol PROFESSIONAL)
    professional = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Role.PROFESSIONAL},
        related_name='availability_rules',
    )
    # Día de la semana (0-6)
    day_of_week = models.IntegerField(
        _('day of week'),
        choices=DAYS_OF_WEEK,
    )
    # Hora de inicio y fin del bloque disponible
    start_time = models.TimeField(_('start time'))
    end_time = models.TimeField(_('end time'))
    # Permite desactivar temporalmente una regla sin eliminarla
    is_active = models.BooleanField(_('active'), default=True)
    
    # Marcas temporales de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('availability rule')
        verbose_name_plural = _('availability rules')
        # Ordenar por profesional, día y hora de inicio
        ordering = ['professional', 'day_of_week', 'start_time']
        # Evitar reglas duplicadas para el mismo profesional, día y hora
        unique_together = ['professional', 'day_of_week', 'start_time']
    
    def __str__(self):
        """Representación legible: 'Nombre - Día: HH:MM-HH:MM'."""
        return f"{self.professional.get_full_name()} - {self.get_day_of_week_display()}: {self.start_time}-{self.end_time}"
    
    def clean(self):
        """
        Validaciones a nivel de modelo:
            - La hora de fin debe ser posterior a la de inicio.
            - Solo los profesionales pueden tener reglas de disponibilidad.
        """
        if self.start_time >= self.end_time:
            raise ValidationError(_('End time must be after start time'))
        
        if not self.professional.is_professional:
            raise ValidationError(_('Availability rules can only be set for professionals'))


class TimeOff(models.Model):
    """
    Período de ausencia de un profesional.

    Define un rango de fechas durante el cual el profesional no está
    disponible para citas. Se utiliza para vacaciones, bajas médicas,
    días personales u cualquier otra razón de ausencia.

    Durante la generación de slots, las fechas dentro de un TimeOff
    se excluyen automáticamente del calendario disponible.
    """
    
    # Profesional al que pertenece la ausencia
    professional = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Role.PROFESSIONAL},
        related_name='time_offs',
    )
    # Rango de fechas de la ausencia (inclusivo)
    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'))
    # Motivo opcional de la ausencia
    reason = models.CharField(
        _('reason'),
        max_length=200,
        blank=True,
        help_text=_('Optional reason for time off')
    )
    
    # Marcas temporales de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('time off')
        verbose_name_plural = _('time offs')
        ordering = ['professional', 'start_date']
    
    def __str__(self):
        """Representación: 'Nombre - Fecha' o 'Nombre - FechaInicio to FechaFin'."""
        if self.start_date == self.end_date:
            return f"{self.professional.get_full_name()} - {self.start_date}"
        return f"{self.professional.get_full_name()} - {self.start_date} to {self.end_date}"
    
    def clean(self):
        """
        Validaciones a nivel de modelo:
            - La fecha de fin debe ser igual o posterior a la de inicio.
            - Solo los profesionales pueden tener períodos de ausencia.
        """
        if self.start_date > self.end_date:
            raise ValidationError(_('End date must be after or equal to start date'))
        
        if not self.professional.is_professional:
            raise ValidationError(_('Time off can only be set for professionals'))
