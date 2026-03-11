"""
Serializadores para los modelos de disponibilidad.

Define tres serializadores:
    - AvailabilityRuleSerializer: CRUD de reglas de disponibilidad semanal.
    - TimeOffSerializer: CRUD de períodos de ausencia.
    - SlotSerializer: Representación de un slot de tiempo disponible
      (usado por el servicio de generación de slots).
"""

from rest_framework import serializers
from .models import AvailabilityRule, TimeOff


class AvailabilityRuleSerializer(serializers.ModelSerializer):
    """
    Serializador para las reglas de disponibilidad semanal.

    Incluye campos calculados:
        - day_name: Nombre legible del día (ej: "Monday", "Tuesday").
        - professional_name: Nombre completo del profesional.

    Validación: verifica que la hora de fin sea posterior a la de inicio.
    """
    
    # Nombre legible del día de la semana
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    # Nombre completo del profesional asociado
    professional_name = serializers.CharField(
        source='professional.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = AvailabilityRule
        fields = [
            'id',
            'professional',
            'professional_name',
            'day_of_week',
            'day_name',
            'start_time',
            'end_time',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Verifica que la hora de fin sea posterior a la de inicio."""
        if attrs.get('start_time') and attrs.get('end_time'):
            if attrs['start_time'] >= attrs['end_time']:
                raise serializers.ValidationError(
                    "End time must be after start time"
                )
        return attrs


class TimeOffSerializer(serializers.ModelSerializer):
    """
    Serializador para los períodos de ausencia.

    Incluye el nombre del profesional como campo de solo lectura.
    Validación: verifica que la fecha de fin sea igual o posterior a la de inicio.
    """
    
    # Nombre completo del profesional asociado
    professional_name = serializers.CharField(
        source='professional.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = TimeOff
        fields = [
            'id',
            'professional',
            'professional_name',
            'start_date',
            'end_date',
            'reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Verifica que la fecha de fin sea igual o posterior a la de inicio."""
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['start_date'] > attrs['end_date']:
                raise serializers.ValidationError(
                    "End date must be after or equal to start date"
                )
        return attrs


class SlotSerializer(serializers.Serializer):
    """
    Serializador para los slots de tiempo disponibles.

    No está vinculado a ningún modelo. Se utiliza para serializar
    los resultados del servicio AvailabilityService.get_available_slots(),
    que genera slots en base a las reglas, ausencias y reservas existentes.

    Campos:
        - start_datetime: Inicio del slot disponible.
        - end_datetime: Fin del slot disponible.
        - is_available: Siempre True (solo se generan slots disponibles).
    """
    
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    is_available = serializers.BooleanField(default=True)
