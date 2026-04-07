"""
Serializadores para el modelo de Servicio.

Define diferentes serializadores según el contexto de uso:
    - ServiceSerializer: Serializador completo con profesionales anidados.
    - ServiceListSerializer: Versión ligera para listados (sin anidamiento).
    - ServiceAdminSerializer: Versión completa para administradores.
"""

from rest_framework import serializers
from bleach import clean
import re
from .models import Service
from apps.users.serializers import ProfessionalSerializer

try:
    import magic
except Exception:  # pragma: no cover
    magic = None

SERVICE_NAME_REGEX = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,'\-]{3,200}$")
ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_IMAGE_SIZE = 3 * 1024 * 1024


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

    def validate_name(self, value):
        value = value.strip()
        if not SERVICE_NAME_REGEX.match(value):
            raise serializers.ValidationError('Nombre de servicio invalido.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_description(self, value):
        value = value.strip()
        if len(value) > 3000:
            raise serializers.ValidationError('La descripcion supera la longitud maxima permitida.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_image(self, value):
        if not value:
            return value
        if value.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError('La imagen supera el tamano maximo permitido de 3MB.')
        if not value.name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            raise serializers.ValidationError('Extension de imagen no permitida.')
        current_pos = value.file.tell()
        header_bytes = value.file.read(2048)
        value.file.seek(current_pos)
        detected = magic.from_buffer(header_bytes, mime=True) if magic else value.content_type
        if detected not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError('El tipo real del archivo no corresponde a una imagen permitida.')
        return value
