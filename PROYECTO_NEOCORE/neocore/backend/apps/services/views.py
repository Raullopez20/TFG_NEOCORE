"""
Vistas (ViewSets) para la gestión de servicios.

Contiene el ViewSet principal que gestiona las operaciones CRUD sobre
los servicios del centro de bienestar, con control de acceso:
    - Público: puede listar y ver el detalle de servicios activos.
    - Administradores: pueden crear, actualizar y eliminar servicios.
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Service
from .serializers import ServiceSerializer, ServiceListSerializer, ServiceAdminSerializer
from apps.users.permissions import IsAdmin


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión del catálogo de servicios.

    Control de acceso:
        - list, retrieve: Acceso público (cualquier visitante puede ver los servicios).
        - create, update, destroy: Solo administradores.

    Los usuarios no autenticados o sin rol de admin solo verán los servicios
    con is_active=True. Los administradores ven todos, incluidos los inactivos.

    Soporta filtrado por estado (is_active), búsqueda por nombre/descripción
    y ordenación por múltiples campos.
    """
    
    # Se usa prefetch_related para optimizar las consultas con la relación ManyToMany
    queryset = Service.objects.prefetch_related('professionals').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'duration_minutes', 'price', 'created_at']
    ordering = ['name']  # Orden alfabético por defecto
    
    def get_serializer_class(self):
        """
        Selecciona el serializador adecuado según la acción y el rol.

        - list: ServiceListSerializer (versión ligera sin profesionales anidados).
        - Admin: ServiceAdminSerializer (todos los campos editables).
        - Otros: ServiceSerializer (versión completa de solo lectura).
        """
        if self.action == 'list':
            return ServiceListSerializer
        if self.request.user.is_authenticated and (
            self.request.user.is_admin_role or self.request.user.is_staff
        ):
            return ServiceAdminSerializer
        return ServiceSerializer
    
    def get_permissions(self):
        """
        Asigna permisos según la acción:
        - list/retrieve: acceso público sin autenticación.
        - create/update/destroy: solo administradores.
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdmin()]
    
    def get_queryset(self):
        """
        Filtra los servicios según el rol del usuario.

        Los administradores ven todos los servicios (activos e inactivos).
        El resto de usuarios solo ven los servicios activos.
        """
        queryset = super().get_queryset()
        
        if not (self.request.user.is_authenticated and (
            self.request.user.is_admin_role or self.request.user.is_staff
        )):
            queryset = queryset.filter(is_active=True)
        
        return queryset
