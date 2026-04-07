"""
Vistas (ViewSets) para la gestión de usuarios y autenticación.

Contiene el ViewSet principal que gestiona todas las operaciones CRUD
sobre los usuarios, con control de acceso basado en roles:
    - Los clientes solo pueden ver y editar su propio perfil.
    - Los profesionales pueden ver su propio perfil.
    - Los administradores tienen acceso completo a todos los usuarios.
    - El listado de profesionales es público (para el catálogo).
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from bleach import clean
import re

from .serializers import (
    UserSerializer,
    ProfessionalSerializer,
    UserUpdateSerializer,
    AdminUserSerializer,
)
from .permissions import IsOwnerOrAdmin, IsAdmin

User = get_user_model()
SPECIALTY_FILTER_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]{1,100}$")


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión completa de usuarios.

    Proporciona operaciones CRUD con control de acceso basado en roles:
        - Clientes: pueden ver y actualizar únicamente su propio perfil.
        - Administradores: pueden gestionar (crear, listar, editar, eliminar) todos los usuarios.
        - Público: puede consultar el listado de profesionales activos.

    Incluye acciones personalizadas:
        - /me/: Obtener los datos del usuario autenticado.
        - /update_me/: Actualizar el perfil del usuario autenticado.
        - /professionals/: Listar profesionales activos (endpoint público).
        - /{id}/professional_detail/: Ver el detalle de un profesional específico.
    """
    
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'specialty', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'specialty']
    ordering_fields = ['created_at', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        Selecciona el serializador adecuado según la acción y el rol del usuario.

        - Para actualizaciones se usa UserUpdateSerializer (campos limitados).
        - Para administradores se usa AdminUserSerializer (todos los campos).
        - Para el resto se usa UserSerializer (campos estándar).
        """
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        # Manejo especial para la generación del esquema OpenAPI
        if getattr(self, 'swagger_fake_view', False):
            return UserSerializer
        if hasattr(self.request.user, 'is_admin_role') and (self.request.user.is_admin_role or self.request.user.is_staff):
            return AdminUserSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Asigna permisos dinámicamente según la acción solicitada.

        - professionals: acceso público (sin autenticación).
        - list, create, destroy: solo administradores.
        - update, partial_update, retrieve: solo el propietario o administradores.
        """
        if self.action == 'professionals':
            return [AllowAny()]
        if self.action in ['list', 'create', 'destroy']:
            return [IsAdmin()]
        if self.action in ['update', 'partial_update', 'retrieve']:
            return [IsOwnerOrAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Filtra el queryset según el rol del usuario autenticado.

        - Administradores: ven todos los usuarios del sistema.
        - Otros usuarios: solo ven su propio registro.
        - Generación de esquema: devuelve queryset vacío.
        """
        if getattr(self, 'swagger_fake_view', False):
            return User.objects.none()
        
        user = self.request.user
        
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return User.objects.all()
        
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Obtiene los datos del usuario autenticado actual.

        Este endpoint es utilizado por el frontend para cargar la información
        del perfil del usuario que ha iniciado sesión.

        Retorna:
            Response: Datos serializados del usuario autenticado.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_me(self, request):
        """
        Actualiza el perfil del usuario autenticado actual.

        Permite modificar datos personales como nombre, teléfono,
        y para profesionales también la especialidad y biografía.
        Soporta actualizaciones parciales (solo los campos enviados).

        Retorna:
            Response: Datos actualizados del usuario.
        """
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def professionals(self, request):
        """
        Lista todos los profesionales activos del centro.

        Endpoint público utilizado por el catálogo del frontend para mostrar
        los profesionales disponibles. Permite filtrar por especialidad
        mediante el parámetro de consulta 'specialty'.

        Parámetros de consulta opcionales:
            - specialty (str): Filtra profesionales por especialidad (búsqueda parcial).

        Retorna:
            Response: Lista de profesionales con datos públicos.
        """
        queryset = User.objects.filter(
            role=User.Role.PROFESSIONAL,
            is_active=True
        )
        
        # Filtrar por especialidad si se proporciona el parámetro
        specialty = request.query_params.get('specialty')
        if specialty:
            specialty = specialty.strip()
            if not SPECIALTY_FILTER_RE.match(specialty):
                return Response({'error': 'Filtro de especialidad invalido'}, status=status.HTTP_400_BAD_REQUEST)
            specialty = clean(specialty, tags=[], attributes={}, strip=True)
            queryset = queryset.filter(specialty__icontains=specialty)
        
        serializer = ProfessionalSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def professional_detail(self, request, pk=None):
        """
        Obtiene el perfil detallado de un profesional específico.

        Endpoint público que devuelve los datos públicos de un profesional
        activo identificado por su ID. Si no existe o no está activo,
        devuelve un error 404.

        Retorna:
            Response: Datos públicos del profesional o error 404.
        """
        try:
            professional = User.objects.get(
                pk=pk,
                role=User.Role.PROFESSIONAL,
                is_active=True
            )
            serializer = ProfessionalSerializer(professional)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Professional not found'},
                status=status.HTTP_404_NOT_FOUND
            )
