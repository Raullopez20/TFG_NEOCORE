"""
Serializadores para el modelo de Reserva (Booking).

Define múltiples serializadores según el contexto de uso:
    - BookingSerializer: Vista completa con relaciones anidadas.
    - BookingCreateSerializer: Creación de nuevas reservas con validaciones.
    - BookingUpdateSerializer: Actualización de notas de la reserva.
    - BookingListSerializer: Versión ligera para listados.
    - BookingStatsSerializer: Estadísticas de reservas para el dashboard admin.
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from bleach import clean

from .models import Booking, Review
from apps.users.serializers import UserSerializer
from apps.services.serializers import ServiceListSerializer
from apps.availability.services import AvailabilityService


class BookingSerializer(serializers.ModelSerializer):
    """
    Serializador completo de la reserva con relaciones anidadas.

    Incluye los datos completos del cliente, profesional y servicio
    como objetos anidados, además de campos calculados como la duración
    en minutos y el estado temporal (pasada/próxima).
    Se utiliza para la vista de detalle de una reserva.
    """
    
    # Datos completos del cliente anidados
    client_info = UserSerializer(source='client', read_only=True)
    # Datos completos del profesional anidados
    professional_info = UserSerializer(source='professional', read_only=True)
    # Datos del servicio anidados (versión ligera)
    service_info = ServiceListSerializer(source='service', read_only=True)
    # Campos calculados desde las propiedades del modelo
    duration_minutes = serializers.IntegerField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'client',
            'client_info',
            'professional',
            'professional_info',
            'service',
            'service_info',
            'start_datetime',
            'end_datetime',
            'duration_minutes',
            'status',
            'client_notes',
            'professional_notes',
            'cancellation_reason',
            'canceled_by',
            'canceled_at',
            'is_past',
            'is_upcoming',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'canceled_by',
            'canceled_at',
            'created_at',
            'updated_at',
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para la creación de nuevas reservas.

    Realiza validaciones críticas antes de permitir la creación:
        - La hora de fin debe ser posterior a la de inicio.
        - No se permiten reservas en el pasado.
        - Se verifica la disponibilidad del profesional en el horario solicitado
          (reglas de disponibilidad, días libres y reservas existentes).

    El cliente se asigna automáticamente desde el usuario autenticado
    y el estado inicial siempre es PENDING.
    """
    
    class Meta:
        model = Booking
        fields = [
            'service',
            'professional',
            'start_datetime',
            'end_datetime',
            'client_notes',
        ]

    def validate_client_notes(self, value):
        value = (value or '').strip()
        if len(value) > 1000:
            raise serializers.ValidationError('Las notas no pueden superar los 1000 caracteres.')
        return clean(value, tags=[], attributes={}, strip=True)
    
    def validate(self, attrs):
        """
        Validaciones de negocio para la creación de una reserva.

        Verifica coherencia temporal, que no sea en el pasado,
        y que el slot esté disponible en el calendario del profesional.
        """
        start_datetime = attrs.get('start_datetime')
        end_datetime = attrs.get('end_datetime')
        professional = attrs.get('professional')
        
        # La hora de fin debe ser posterior a la de inicio
        if start_datetime >= end_datetime:
            raise serializers.ValidationError(
                "End time must be after start time"
            )
        
        # No se permiten reservas en el pasado
        if start_datetime < timezone.now():
            raise serializers.ValidationError(
                "Cannot book appointments in the past"
            )
        
        # Verificar que el slot esté disponible consultando el servicio de disponibilidad
        is_valid, error_msg = AvailabilityService.validate_slot_available(
            professional_id=professional.id,
            start_datetime=start_datetime,
            end_datetime=end_datetime
        )
        
        if not is_valid:
            raise serializers.ValidationError(error_msg)
        
        return attrs
    
    def create(self, validated_data):
        """
        Crea la reserva asignando automáticamente el cliente
        desde el usuario autenticado y el estado como PENDING.
        """
        validated_data['client'] = self.context['request'].user
        validated_data['status'] = Booking.Status.PENDING
        return super().create(validated_data)


class BookingUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para la actualización de notas de una reserva.

    Permite modificar únicamente las notas del cliente y del profesional.
    Incluye validación para que los clientes no puedan modificar las
    notas internas del profesional.
    """
    
    class Meta:
        model = Booking
        fields = ['client_notes', 'professional_notes']

    def validate_client_notes(self, value):
        value = (value or '').strip()
        if len(value) > 1000:
            raise serializers.ValidationError('Las notas no pueden superar los 1000 caracteres.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_professional_notes(self, value):
        value = (value or '').strip()
        if len(value) > 2000:
            raise serializers.ValidationError('Las notas profesionales no pueden superar los 2000 caracteres.')
        return clean(value, tags=[], attributes={}, strip=True)
    
    def validate(self, attrs):
        """Verifica que los clientes no intenten modificar las notas del profesional."""
        user = self.context['request'].user
        
        if user.is_client and 'professional_notes' in attrs:
            raise serializers.ValidationError(
                "Clients cannot update professional notes"
            )
        
        return attrs


class BookingListSerializer(serializers.ModelSerializer):
    """
    Serializador ligero para el listado de reservas.

    Incluye solo los nombres de los participantes y el servicio
    (como cadenas de texto), sin objetos anidados, para optimizar
    el rendimiento en las vistas de listado.
    """
    
    # Nombres obtenidos directamente de las relaciones
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    professional_name = serializers.CharField(source='professional.get_full_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'client_name',
            'professional_name',
            'service_name',
            'start_datetime',
            'end_datetime',
            'status',
            'created_at',
        ]


class BookingStatsSerializer(serializers.Serializer):
    """
    Serializador para las estadísticas de reservas (dashboard de administración).

    No está vinculado a ningún modelo. Sirve para validar y serializar
    los datos estadísticos calculados en la vista: totales por estado,
    agrupaciones por servicio y profesional, y métricas temporales.
    """
    
    # Contadores generales por estado
    total_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    completed_bookings = serializers.IntegerField()
    canceled_bookings = serializers.IntegerField()
    rejected_bookings = serializers.IntegerField()
    
    # Agrupación por servicio: {'nombre_servicio': cantidad}
    bookings_by_service = serializers.DictField(child=serializers.IntegerField())
    
    # Agrupación por profesional: {'nombre_profesional': cantidad}
    bookings_by_professional = serializers.DictField(child=serializers.IntegerField())
    
    # Métricas temporales
    bookings_this_week = serializers.IntegerField()
    bookings_this_month = serializers.IntegerField()


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializador completo de una reseña.

    Expone los datos necesarios para mostrar la reseña en el perfil
    público del profesional o en los testimonios de la landing.
    """

    client_name = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='booking.service.name', read_only=True)
    professional_id = serializers.IntegerField(source='booking.professional_id', read_only=True)
    professional_name = serializers.CharField(
        source='booking.professional.get_full_name', read_only=True
    )

    class Meta:
        model = Review
        fields = [
            'id',
            'booking',
            'rating',
            'comment',
            'is_visible',
            'client_name',
            'service_name',
            'professional_id',
            'professional_name',
            'created_at',
        ]
        read_only_fields = ['id', 'is_visible', 'created_at']

    def get_client_name(self, obj):
        """Devuelve el nombre del cliente (solo nombre + inicial del apellido)."""
        client = obj.booking.client
        first = client.first_name or ''
        last = client.last_name or ''
        if last:
            return f"{first} {last[0]}."
        return first or client.email.split('@')[0]


class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear una nueva reseña.

    Solo el cliente dueño de la reserva puede dejar la reseña, y solo
    cuando la cita está en estado DONE. La validación cruzada se hace
    en validate(), que recibe el contexto con el usuario autenticado.
    """

    class Meta:
        model = Review
        fields = ['booking', 'rating', 'comment']

    def validate_comment(self, value):
        value = (value or '').strip()
        if len(value) > 2000:
            raise serializers.ValidationError(
                'El comentario no puede superar los 2000 caracteres.'
            )
        return clean(value, tags=[], attributes={}, strip=True)

    def validate(self, attrs):
        request = self.context.get('request')
        booking = attrs.get('booking')
        if booking is None:
            raise serializers.ValidationError('La reserva es obligatoria.')
        if request and booking.client_id != request.user.id:
            raise serializers.ValidationError(
                'Solo el cliente de la reserva puede dejar una reseña.'
            )
        if booking.status != Booking.Status.DONE:
            raise serializers.ValidationError(
                'Solo se pueden reseñar citas completadas.'
            )
        if hasattr(booking, 'review'):
            raise serializers.ValidationError(
                'Esta reserva ya tiene una reseña.'
            )
        return attrs
