"""
Serializers for User model and authentication.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
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
    """Serializer for Professional users (public view)."""
    
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
    """Custom registration serializer with additional fields."""
    
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    phone = serializers.CharField(required=False, max_length=20)
    
    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        data['phone'] = self.validated_data.get('phone', '')
        return data
    
    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get('first_name')
        user.last_name = self.cleaned_data.get('last_name')
        user.phone = self.cleaned_data.get('phone', '')
        user.role = User.Role.CLIENT  # Default role for registration
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
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
        user = self.instance
        
        # Only professionals can update specialty and bio
        if not user.is_professional:
            attrs.pop('specialty', None)
            attrs.pop('bio', None)
        
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin serializer with full user details and role management."""
    
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
