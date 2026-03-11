"""
Configuración del panel de administración para el modelo de Reserva (Booking).

Personaliza la interfaz del admin de Django para ofrecer una gestión visual
de las reservas con badges de colores por estado, jerarquía por fechas,
y acciones masivas para confirmar, finalizar o cancelar reservas.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Configuración del admin para el modelo Booking.

    Características destacadas:
        - Badge de color según el estado de la reserva.
        - Jerarquía por fecha para navegación temporal.
        - Secciones colapsables para cancelación y metadatos.
        - Acciones masivas para cambiar estados.
    """
    
    # Columnas visibles en el listado de reservas
    list_display = [
        'id',
        'client',
        'professional',
        'service',
        'start_datetime',
        'status_badge',
        'created_at',
    ]
    # Filtros en la barra lateral
    list_filter = ['status', 'service', 'professional', 'created_at', 'start_datetime']
    # Campos de búsqueda
    search_fields = [
        'client__first_name',
        'client__last_name',
        'client__email',
        'professional__first_name',
        'professional__last_name',
        'professional__email',
        'service__name',
    ]
    # Navegación jerárquica por fecha de inicio
    date_hierarchy = 'start_datetime'
    
    # Agrupación de campos en secciones lógicas
    fieldsets = (
        ('Participantes', {
            'fields': ('client', 'professional', 'service')
        }),
        ('Horario', {
            'fields': ('start_datetime', 'end_datetime', 'status')
        }),
        ('Notas', {
            'fields': ('client_notes', 'professional_notes')
        }),
        ('Cancelación', {
            'fields': ('cancellation_reason', 'canceled_by', 'canceled_at'),
            'classes': ('collapse',)  # Sección colapsable por defecto
        }),
        ('Metadatos', {
            'fields': ('reminder_sent', 'reminder_sent_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def status_badge(self, obj):
        """
        Muestra el estado de la reserva como un badge con color.

        Colores:
            - Amarillo: Pendiente
            - Verde: Confirmada
            - Rojo: Rechazada
            - Gris: Cancelada
            - Azul: Completada
        """
        colors = {
            'PENDING': '#ffc107',
            'CONFIRMED': '#28a745',
            'REJECTED': '#dc3545',
            'CANCELED': '#6c757d',
            'DONE': '#007bff',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Estado'
    
    # --- Acciones masivas ---
    actions = ['mark_as_confirmed', 'mark_as_done', 'mark_as_canceled']
    
    def mark_as_confirmed(self, request, queryset):
        """Acción masiva: confirmar las reservas pendientes seleccionadas."""
        updated = queryset.filter(status=Booking.Status.PENDING).update(
            status=Booking.Status.CONFIRMED
        )
        self.message_user(request, f'{updated} reservas marcadas como confirmadas.')
    mark_as_confirmed.short_description = 'Marcar seleccionadas como Confirmadas'
    
    def mark_as_done(self, request, queryset):
        """Acción masiva: marcar como completadas las reservas confirmadas seleccionadas."""
        updated = queryset.filter(status=Booking.Status.CONFIRMED).update(
            status=Booking.Status.DONE
        )
        self.message_user(request, f'{updated} reservas marcadas como completadas.')
    mark_as_done.short_description = 'Marcar seleccionadas como Completadas'
    
    def mark_as_canceled(self, request, queryset):
        """Acción masiva: cancelar las reservas pendientes o confirmadas seleccionadas."""
        from django.utils import timezone
        updated = queryset.filter(
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED]
        ).update(
            status=Booking.Status.CANCELED,
            canceled_by=request.user,
            canceled_at=timezone.now()
        )
        self.message_user(request, f'{updated} reservas marcadas como canceladas.')
    mark_as_canceled.short_description = 'Marcar seleccionadas como Canceladas'
