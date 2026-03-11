"""
Modelos de usuario del proyecto NeoCore.

Define el modelo de usuario personalizado que extiende AbstractUser de Django
para soportar un sistema de roles (Cliente, Profesional, Administrador).
Este modelo es la base de toda la gestión de identidad y autenticación
del sistema.

Características principales:
    - El email es el identificador principal (en lugar de username)
    - Tres roles diferenciados con permisos específicos
    - Campos específicos para profesionales (especialidad, biografía)
    - Imagen de perfil opcional
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser de Django.

    Soporta tres roles principales:
        - CLIENT: Clientes que reservan citas con los profesionales.
        - PROFESSIONAL: Profesionales que ofrecen servicios (fisioterapeutas, nutricionistas, etc.).
        - ADMIN: Administradores con acceso total al sistema.

    El campo 'email' se utiliza como identificador único para el inicio de sesión,
    reemplazando al 'username' tradicional de Django.
    """
    
    class Role(models.TextChoices):
        """
        Enumeración de los roles disponibles en el sistema.
        Se almacenan como cadenas de texto en la base de datos.
        """
        CLIENT = 'CLIENT', _('Client')
        PROFESSIONAL = 'PROFESSIONAL', _('Professional')
        ADMIN = 'ADMIN', _('Administrator')
    
    # Se hace el username opcional, ya que se usa el email como identificador principal
    username = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        null=True,
    )
    
    # Email como campo principal de identificación (obligatorio y único)
    email = models.EmailField(_('email address'), unique=True)
    
    # Información personal básica
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    
    # Rol del usuario en el sistema (por defecto es Cliente)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
    
    # Campos específicos para usuarios con rol PROFESSIONAL.
    # Solo son relevantes cuando el usuario es un profesional.
    specialty = models.CharField(
        _('specialty'),
        max_length=100,
        blank=True,
        help_text=_('E.g., Physiotherapy, Nutrition, Personal Training')
    )
    bio = models.TextField(_('biography'), blank=True)
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
    )
    
    # Campos de auditoría: fechas de creación y última actualización
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Configuración de autenticación: se usa email en lugar de username
    USERNAME_FIELD = 'email'
    # Campos obligatorios al crear un superusuario por consola
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']  # Los usuarios más recientes primero
    
    def __str__(self):
        """Representación en texto del usuario: nombre completo y email."""
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Devuelve el nombre completo del usuario (nombre + apellidos)."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def save(self, *args, **kwargs):
        """
        Sobrescribe el método save para auto-generar el username
        a partir del email si no se ha proporcionado uno explícitamente.
        """
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)
    
    @property
    def is_client(self):
        """Comprueba si el usuario tiene el rol de Cliente."""
        return self.role == self.Role.CLIENT
    
    @property
    def is_professional(self):
        """Comprueba si el usuario tiene el rol de Profesional."""
        return self.role == self.Role.PROFESSIONAL
    
    @property
    def is_admin_role(self):
        """Comprueba si el usuario tiene el rol de Administrador."""
        return self.role == self.Role.ADMIN
