"""
Serializers for Service model.
"""

from rest_framework import serializers
from .models import Service
from apps.users.serializers import ProfessionalSerializer


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model."""
    
    available_professionals_count = serializers.IntegerField(read_only=True)
    professionals_list = ProfessionalSerializer(
        source='professionals',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'description',
            'duration_minutes',
            'price',
            'is_active',
            'image',
            'available_professionals_count',
            'professionals_list',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ServiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for service listings."""
    
    available_professionals_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'description',
            'duration_minutes',
            'price',
            'image',
            'available_professionals_count',
        ]


class ServiceAdminSerializer(serializers.ModelSerializer):
    """Admin serializer with full control."""
    
    class Meta:
        model = Service
        fields = '__all__'
