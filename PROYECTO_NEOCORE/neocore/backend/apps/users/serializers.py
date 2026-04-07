"""
Serializadores para el modelo de Usuario y la autenticación.

Los serializadores se encargan de convertir los objetos del modelo User
a formato JSON (serialización) y de validar los datos de entrada recibidos
en las peticiones HTTP (deserialización).

Clases incluidas:
    - UserSerializer: Serializador general del usuario autenticado.
    - ProfessionalSerializer: Vista pública reducida de un profesional.
    - CustomRegisterSerializer: Registro de nuevos usuarios con campos adicionales.
    - UserUpdateSerializer: Actualización del perfil de usuario.
    - AdminUserSerializer: Serializador completo para administradores.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator, RegexValidator
from django.utils import timezone
from bleach import clean
import re
from dj_rest_auth.registration.serializers import RegisterSerializer

try:
    import magic
except Exception:  # pragma: no cover
    magic = None

User = get_user_model()

NAME_REGEX = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,150}$")
SPANISH_PHONE_VALIDATOR = RegexValidator(
    regex=r'^(?:\+34|0034|34)?[6-9]\d{8}$',
    message='Formato de telefono espanol invalido.',
)
ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_IMAGE_SIZE = 2 * 1024 * 1024


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador principal del modelo User.

    Devuelve los datos básicos del usuario autenticado, incluyendo
    un campo calculado 'full_name' con el nombre completo.
    Los campos 'id', 'created_at' y 'role' son de solo lectura
    para evitar manipulación desde el cliente.
    """
    
    # Campo calculado que obtiene el nombre completo del método get_full_name()
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'role',
            'specialty',
            'bio',
            'profile_image',
            'gdpr_consent',
            'gdpr_consent_at',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'role', 'gdpr_consent', 'gdpr_consent_at']


class ProfessionalSerializer(serializers.ModelSerializer):
    """
    Serializador de vista pública para usuarios con rol de Profesional.

    Expone únicamente la información relevante que los clientes necesitan
    ver al navegar el catálogo de profesionales: nombre, especialidad,
    biografía e imagen de perfil, además de la valoración media calculada
    a partir de las reseñas visibles de sus citas completadas.
    """

    full_name = serializers.CharField(source='get_full_name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'specialty',
            'bio',
            'profile_image',
            'average_rating',
            'reviews_count',
        ]

    def _visible_reviews_qs(self, obj):
        # Import local para evitar dependencia circular bookings <-> users
        from apps.bookings.models import Review
        return Review.objects.filter(
            booking__professional_id=obj.id,
            is_visible=True,
        )

    def get_average_rating(self, obj):
        from django.db.models import Avg
        agg = self._visible_reviews_qs(obj).aggregate(avg=Avg('rating'))
        return round(agg['avg'], 2) if agg['avg'] is not None else None

    def get_reviews_count(self, obj):
        return self._visible_reviews_qs(obj).count()


class CustomRegisterSerializer(RegisterSerializer):
    """
    Serializador personalizado para el registro de nuevos usuarios.

    Extiende el RegisterSerializer de dj-rest-auth para incluir campos
    adicionales obligatorios (nombre y apellidos) y opcionales (teléfono).
    Al registrarse, todos los nuevos usuarios reciben automáticamente
    el rol de CLIENT.
    """
    
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    phone = serializers.CharField(required=False, max_length=20)
    gdpr_consent = serializers.BooleanField(required=True)

    def validate_email(self, value):
        EmailValidator()(value)
        return value.lower().strip()

    def validate_first_name(self, value):
        value = value.strip()
        if not NAME_REGEX.match(value):
            raise serializers.ValidationError('El nombre contiene caracteres no permitidos.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_last_name(self, value):
        value = value.strip()
        if not NAME_REGEX.match(value):
            raise serializers.ValidationError('Los apellidos contienen caracteres no permitidos.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_phone(self, value):
        normalized = (value or '').replace(' ', '')
        if not normalized:
            return ''
        SPANISH_PHONE_VALIDATOR(normalized)
        return normalized

    def validate_gdpr_consent(self, value):
        if value is not True:
            raise serializers.ValidationError('Debes aceptar el consentimiento RGPD para registrarte.')
        return value
    
    def get_cleaned_data(self):
        """Obtiene los datos validados incluyendo los campos personalizados."""
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        data['phone'] = self.validated_data.get('phone', '')
        data['gdpr_consent'] = self.validated_data.get('gdpr_consent', False)
        return data
    
    def save(self, request):
        """
        Crea el usuario y asigna los campos personalizados.
        El rol se establece siempre como CLIENT para las altas públicas.
        """
        user = super().save(request)
        user.first_name = self.cleaned_data.get('first_name')
        user.last_name = self.cleaned_data.get('last_name')
        user.phone = self.cleaned_data.get('phone', '')
        user.gdpr_consent = bool(self.cleaned_data.get('gdpr_consent'))
        user.gdpr_consent_at = timezone.now() if user.gdpr_consent else None
        user.role = User.Role.CLIENT
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para la actualización del perfil de usuario.

    Permite a los usuarios modificar sus datos personales.
    Los campos de especialidad y biografía solo se pueden actualizar
    si el usuario tiene el rol de PROFESSIONAL; para los demás roles
    estos campos son ignorados automáticamente en la validación.
    """
    
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'phone',
            'specialty',
            'bio',
            'profile_image',
        ]

    def validate_first_name(self, value):
        value = value.strip()
        if not NAME_REGEX.match(value):
            raise serializers.ValidationError('El nombre contiene caracteres no permitidos.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_last_name(self, value):
        value = value.strip()
        if not NAME_REGEX.match(value):
            raise serializers.ValidationError('Los apellidos contienen caracteres no permitidos.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_phone(self, value):
        normalized = (value or '').replace(' ', '')
        if not normalized:
            return ''
        SPANISH_PHONE_VALIDATOR(normalized)
        return normalized

    def validate_specialty(self, value):
        value = (value or '').strip()
        if len(value) > 100:
            raise serializers.ValidationError('La especialidad supera la longitud maxima permitida.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_bio(self, value):
        value = (value or '').strip()
        if len(value) > 2500:
            raise serializers.ValidationError('La biografia no puede superar 2500 caracteres.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_profile_image(self, value):
        if value.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError('La imagen supera el tamano maximo permitido de 2MB.')
        if not value.name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            raise serializers.ValidationError('Extension de imagen no permitida.')

        current_pos = value.file.tell()
        header_bytes = value.file.read(2048)
        value.file.seek(current_pos)
        detected = magic.from_buffer(header_bytes, mime=True) if magic else value.content_type
        if detected not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError('El tipo real del archivo no corresponde a una imagen permitida.')
        return value
    
    def validate(self, attrs):
        """
        Validación personalizada: elimina los campos de especialidad y biografía
        si el usuario no es un profesional, para prevenir modificaciones no autorizadas.
        """
        user = self.instance
        
        if not user.is_professional:
            attrs.pop('specialty', None)
            attrs.pop('bio', None)
        
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializador completo para administradores.

    Expone todos los campos del usuario, incluyendo los de gestión
    (is_staff, is_superuser, updated_at). Permite a los administradores
    ver y modificar cualquier aspecto de los perfiles de usuario,
    incluyendo el cambio de roles.
    """
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'role',
            'specialty',
            'bio',
            'profile_image',
            'is_active',
            'is_staff',
            'is_superuser',
            'gdpr_consent',
            'gdpr_consent_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
