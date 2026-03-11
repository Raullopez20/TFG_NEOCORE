"""
Serializadores para el modelo de Servicio.

Define diferentes serializadores según el contexto de uso:
    - ServiceSerializer: Serializador completo con profesionales anidados.
    - ServiceListSerializer: Versión ligera para listados (sin anidamiento).
    - ServiceAdminSerializer: Versión completa para administradores.
"""

from rest_framework import serializers
from .models import Service
from apps.users.serializers import ProfessionalSerializer


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializador completo del modelo Service.

    Incluye el conteo de profesionales disponibles y la lista detallada
    de profesionales que ofrecen el servicio (como objetos anidados).
    Se utiliza para la vista de detalle de un servicio.
    """
    
    # Número de profesionales activos que ofrecen este servicio
    available_professionals_count = serializers.IntegerField(read_only=True)
    # Lista completa de profesionales con sus datos públicos
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
    """
    Serializador ligero para el listado de servicios.

    Excluye la lista de profesionales anidados para reducir el tamaño
    de la respuesta en las vistas de listado. Solo incluye el conteo
    de profesionales disponibles.
    """
    
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
    """
    Serializador de administración con acceso total a todos los campos.

    Utilizado por los administradores para crear y modificar servicios,
    incluyendo la asignación de profesionales y el estado activo/inactivo.
    """
    
    class Meta:
        model = Service
        fields = '__all__'
