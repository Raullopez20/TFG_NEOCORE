"""
Serializers for Booking model.
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta

from .models import Booking
from apps.users.serializers import UserSerializer
from apps.services.serializers import ServiceListSerializer
from apps.availability.services import AvailabilityService


class BookingSerializer(serializers.ModelSerializer):
    """Full booking serializer with nested relations."""
    
    client_info = UserSerializer(source='client', read_only=True)
    professional_info = UserSerializer(source='professional', read_only=True)
    service_info = ServiceListSerializer(source='service', read_only=True)
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
    """Serializer for creating new bookings."""
    
    class Meta:
        model = Booking
        fields = [
            'service',
            'professional',
            'start_datetime',
            'end_datetime',
            'client_notes',
        ]
    
    def validate(self, attrs):
        start_datetime = attrs.get('start_datetime')
        end_datetime = attrs.get('end_datetime')
        professional = attrs.get('professional')
        
        # Validate times
        if start_datetime >= end_datetime:
            raise serializers.ValidationError(
                "End time must be after start time"
            )
        
        # Validate not in past
        if start_datetime < timezone.now():
            raise serializers.ValidationError(
                "Cannot book appointments in the past"
            )
        
        # Validate slot availability
        is_valid, error_msg = AvailabilityService.validate_slot_available(
            professional_id=professional.id,
            start_datetime=start_datetime,
            end_datetime=end_datetime
        )
        
        if not is_valid:
            raise serializers.ValidationError(error_msg)
        
        return attrs
    
    def create(self, validated_data):
        # Set client from request context
        validated_data['client'] = self.context['request'].user
        validated_data['status'] = Booking.Status.PENDING
        return super().create(validated_data)


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating booking notes."""
    
    class Meta:
        model = Booking
        fields = ['client_notes', 'professional_notes']
    
    def validate(self, attrs):
        user = self.context['request'].user
        
        # Clients can only update client_notes
        if user.is_client and 'professional_notes' in attrs:
            raise serializers.ValidationError(
                "Clients cannot update professional notes"
            )
        
        return attrs


class BookingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for booking lists."""
    
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
    """Serializer for booking statistics."""
    
    total_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    completed_bookings = serializers.IntegerField()
    canceled_bookings = serializers.IntegerField()
    rejected_bookings = serializers.IntegerField()
    
    # By service
    bookings_by_service = serializers.DictField(child=serializers.IntegerField())
    
    # By professional
    bookings_by_professional = serializers.DictField(child=serializers.IntegerField())
    
    # Time-based
    bookings_this_week = serializers.IntegerField()
    bookings_this_month = serializers.IntegerField()
