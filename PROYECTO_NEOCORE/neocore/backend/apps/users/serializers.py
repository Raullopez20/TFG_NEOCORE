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
from dj_rest_auth.registration.serializers import RegisterSerializer

User = get_user_model()


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
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'role']


class ProfessionalSerializer(serializers.ModelSerializer):
    """
    Serializador de vista pública para usuarios con rol de Profesional.

    Expone únicamente la información relevante que los clientes necesitan
    ver al navegar el catálogo de profesionales: nombre, especialidad,
    biografía e imagen de perfil. No expone datos sensibles como email o teléfono.
    """
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'specialty',
            'bio',
            'profile_image',
        ]


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
    
    def get_cleaned_data(self):
        """Obtiene los datos validados incluyendo los campos personalizados."""
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        data['phone'] = self.validated_data.get('phone', '')
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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
