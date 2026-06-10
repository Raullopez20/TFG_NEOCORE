"""
Configuración del panel de administración para el modelo de Usuario.

Personaliza la interfaz del panel de administración de Django para
ofrecer una visión completa y funcional de la gestión de usuarios,
incluyendo filtros por rol, especialidad y estado, así como
agrupación de campos por secciones lógicas.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Configuración personalizada del admin para el modelo User.

    Extiende UserAdmin de Django para adaptarlo al modelo de usuario
    personalizado con roles, especialidades y campos adicionales.
    """
    
    # Columnas que se muestran en la lista de usuarios
    list_display = [
        'email',
        'first_name',
        'last_name',
        'role',
        'specialty',
        'is_active',
        'created_at',
    ]
    # Filtros disponibles en la barra lateral derecha
    list_filter = ['role', 'specialty', 'is_active', 'is_staff', 'created_at']
    # Campos por los que se puede buscar
    search_fields = ['email', 'first_name', 'last_name', 'specialty']
    # Orden por defecto (más recientes primero)
    ordering = ['-created_at']
    
    # Agrupación de campos en el formulario de edición
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone', 'profile_image')}),
        (_('Role & Professional info'), {'fields': ('role', 'specialty', 'bio')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    # Campos que se muestran al crear un nuevo usuario desde el admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
    
    # Campos de solo lectura (no editables)
    readonly_fields = ['created_at', 'updated_at', 'last_login']
