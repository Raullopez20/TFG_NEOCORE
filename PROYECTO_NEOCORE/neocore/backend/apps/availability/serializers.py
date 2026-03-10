"""
Serializers for Availability models.
"""

from rest_framework import serializers
from .models import AvailabilityRule, TimeOff


class AvailabilityRuleSerializer(serializers.ModelSerializer):
    """Serializer for AvailabilityRule model."""
    
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
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
        if attrs.get('start_time') and attrs.get('end_time'):
            if attrs['start_time'] >= attrs['end_time']:
                raise serializers.ValidationError(
                    "End time must be after start time"
                )
        return attrs


class TimeOffSerializer(serializers.ModelSerializer):
    """Serializer for TimeOff model."""
    
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
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['start_date'] > attrs['end_date']:
                raise serializers.ValidationError(
                    "End date must be after or equal to start date"
                )
        return attrs


class SlotSerializer(serializers.Serializer):
    """Serializer for available time slots."""
    
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    is_available = serializers.BooleanField(default=True)
