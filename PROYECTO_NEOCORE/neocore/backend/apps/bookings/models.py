"""
Modelos para la gestión de reservas/citas.

Define el modelo Booking que representa una cita entre un cliente y un
profesional para un servicio determinado. Gestiona todo el ciclo de vida
de la reserva, desde su creación (PENDING) hasta su finalización (DONE)
o cancelación (CANCELED).

Flujo de estados de una reserva:
    PENDING -> CONFIRMED -> DONE       (flujo normal)
    PENDING -> REJECTED                 (rechazada por el profesional)
    PENDING -> CANCELED                 (cancelada por el cliente)
    CONFIRMED -> CANCELED               (cancelada antes de realizarse)
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()


class Booking(models.Model):
    """
    Modelo que representa una reserva/cita entre un cliente y un profesional.

    Contiene toda la información necesaria para gestionar la cita: participantes,
    servicio, horario, estado, notas y datos de cancelación. Incluye índices
    de base de datos optimizados para las consultas más frecuentes.
    """
    
    class Status(models.TextChoices):
        """
        Estados posibles de una reserva.

        PENDING:    Recién creada, esperando confirmación del profesional.
        CONFIRMED:  Aceptada por el profesional, pendiente de realizarse.
        REJECTED:   Rechazada por el profesional.
        CANCELED:   Cancelada por el cliente o el profesional.
        DONE:       Cita realizada satisfactoriamente.
        """
        PENDING = 'PENDING', _('Pending')
        CONFIRMED = 'CONFIRMED', _('Confirmed')
        REJECTED = 'REJECTED', _('Rejected')
        CANCELED = 'CANCELED', _('Canceled')
        DONE = 'DONE', _('Done')
    
    # --- Participantes de la cita ---
    # Cliente que solicita la cita (solo usuarios con rol CLIENT)
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings_as_client',
        limit_choices_to={'role': User.Role.CLIENT},
    )
    # Profesional que atiende la cita (solo usuarios con rol PROFESSIONAL)
    professional = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings_as_professional',
        limit_choices_to={'role': User.Role.PROFESSIONAL},
    )
    
    # --- Servicio asociado ---
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    
    # --- Horario de la cita ---
    start_datetime = models.DateTimeField(_('start date/time'))
    end_datetime = models.DateTimeField(_('end date/time'))
    
    # --- Estado actual de la reserva ---
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    
    # --- Notas adicionales ---
    # Notas del cliente para el profesional (ej: síntomas, preferencias)
    client_notes = models.TextField(
        _('client notes'),
        blank=True,
        help_text=_('Notes from client to professional')
    )
    # Notas internas del profesional (no visibles para el cliente)
    professional_notes = models.TextField(
        _('professional notes'),
        blank=True,
        help_text=_('Internal notes by professional')
    )
    
    # --- Datos de cancelación/rechazo ---
    cancellation_reason = models.TextField(
        _('cancellation reason'),
        blank=True,
    )
    # Usuario que canceló la reserva (puede ser cliente, profesional o admin)
    canceled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings_canceled',
    )
    canceled_at = models.DateTimeField(null=True, blank=True)
    
    # --- Control de recordatorios ---
    # Indica si ya se envió el recordatorio por email (24h antes de la cita)
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    # --- Campos de auditoría ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('booking')
        verbose_name_plural = _('bookings')
        ordering = ['-start_datetime']  # Las citas más próximas primero
        # Índices para optimizar las consultas más frecuentes
        indexes = [
            models.Index(fields=['client', 'status']),           # Reservas de un cliente por estado
            models.Index(fields=['professional', 'status']),     # Reservas de un profesional por estado
            models.Index(fields=['start_datetime']),             # Búsqueda por fecha de inicio
            models.Index(fields=['status', 'start_datetime']),   # Reservas por estado y fecha
        ]
    
    def __str__(self):
        """Representación en texto: cliente -> profesional | servicio | fecha."""
        return f"{self.client.get_full_name()} → {self.professional.get_full_name()} | {self.service.name} | {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"
    
    def clean(self):
        """
        Validaciones de integridad del modelo:
        - La hora de fin debe ser posterior a la de inicio.
        - El cliente debe tener el rol CLIENT.
        - El profesional debe tener el rol PROFESSIONAL.
        """
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError(_('End time must be after start time'))
        
        if self.client and not self.client.is_client:
            raise ValidationError(_('Client must have CLIENT role'))
        
        if self.professional and not self.professional.is_professional:
            raise ValidationError(_('Professional must have PROFESSIONAL role'))
    
    def save(self, *args, **kwargs):
        """Ejecuta las validaciones antes de guardar el registro."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def duration_minutes(self):
        """Calcula la duración de la cita en minutos."""
        if self.start_datetime and self.end_datetime:
            delta = self.end_datetime - self.start_datetime
            return int(delta.total_seconds() / 60)
        return 0
    
    @property
    def is_past(self):
        """Comprueba si la cita ya ha pasado (la hora de fin es anterior a la actual)."""
        return self.end_datetime < timezone.now()
    
    @property
    def is_upcoming(self):
        """Comprueba si la cita es próxima (confirmada y en el futuro)."""
        return (
            self.status == self.Status.CONFIRMED and
            self.start_datetime > timezone.now()
        )
    
    def can_be_canceled(self):
        """Determina si la reserva puede ser cancelada (solo si está pendiente o confirmada)."""
        return self.status in [self.Status.PENDING, self.Status.CONFIRMED]
    
    def can_be_confirmed(self):
        """Determina si la reserva puede ser confirmada (solo si está pendiente)."""
        return self.status == self.Status.PENDING
    
    def can_be_rejected(self):
        """Determina si la reserva puede ser rechazada (solo si está pendiente)."""
        return self.status == self.Status.PENDING
