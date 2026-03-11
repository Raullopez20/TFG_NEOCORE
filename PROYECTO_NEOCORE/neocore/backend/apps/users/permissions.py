"""
Permisos personalizados para el control de acceso en NeoCore.

Define clases de permisos reutilizables que restringen el acceso a las
vistas de la API según el rol del usuario autenticado. Estos permisos
se asignan a las vistas mediante el atributo 'permission_classes'.

Permisos disponibles:
    - IsOwnerOrAdmin: Solo el dueño del recurso o un administrador puede acceder.
    - IsProfessional: Solo usuarios con rol de profesional.
    - IsAdmin: Solo usuarios con rol de administrador o staff.
    - IsClient: Solo usuarios con rol de cliente.
"""

from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso que restringe el acceso a nivel de objeto.

    Permite el acceso solo si:
        - El usuario es administrador o miembro del staff (acceso completo).
        - El usuario es el propietario del objeto (el objeto es él mismo).

    Se utiliza principalmente en las vistas de perfil de usuario para
    asegurar que cada usuario solo pueda ver/editar sus propios datos.
    """
    
    def has_object_permission(self, request, view, obj):
        # Los administradores tienen acceso total
        if request.user.is_admin_role or request.user.is_staff:
            return True
        
        # Los demás usuarios solo pueden acceder a sus propios datos
        return obj == request.user


class IsProfessional(permissions.BasePermission):
    """
    Permiso que solo permite el acceso a usuarios con rol de Profesional.

    Se utiliza en las vistas donde solo los profesionales deben poder
    realizar acciones, como gestionar su disponibilidad horaria.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_professional


class IsAdmin(permissions.BasePermission):
    """
    Permiso que solo permite el acceso a administradores.

    Verifica que el usuario esté autenticado y tenga el rol ADMIN
    o sea miembro del staff de Django (is_staff=True).
    Se utiliza en vistas de gestión del sistema (estadísticas, CRUD de usuarios, etc.).
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin_role or request.user.is_staff
        )


class IsClient(permissions.BasePermission):
    """
    Permiso que solo permite el acceso a usuarios con rol de Cliente.

    Se utiliza en vistas específicas para clientes, como la creación
    de nuevas reservas.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_client
