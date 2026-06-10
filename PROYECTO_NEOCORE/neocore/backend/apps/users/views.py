"""
Vistas (ViewSets) para la gestión de usuarios y autenticación.

Contiene el ViewSet principal que gestiona todas las operaciones CRUD
sobre los usuarios, con control de acceso basado en roles:
    - Los clientes solo pueden ver y editar su propio perfil.
    - Los profesionales pueden ver su propio perfil.
    - Los administradores tienen acceso completo a todos los usuarios.
    - El listado de profesionales es público (para el catálogo).
"""

import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone
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
security_logger = logging.getLogger('security')


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _serialize_booking_for_export(booking):
    return {
        'id': booking.id,
        'service': booking.service.name,
        'professional_id': booking.professional_id,
        'professional_name': booking.professional.get_full_name(),
        'client_id': booking.client_id,
        'client_name': booking.client.get_full_name(),
        'start_datetime': booking.start_datetime.isoformat(),
        'end_datetime': booking.end_datetime.isoformat(),
        'status': booking.status,
        'client_notes': booking.client_notes,
        'professional_notes': booking.professional_notes,
        'cancellation_reason': booking.cancellation_reason,
        'created_at': booking.created_at.isoformat(),
        'updated_at': booking.updated_at.isoformat(),
    }


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

        - Admins en update/partial_update → AdminUserSerializer (permite cambiar role, is_active, password).
        - Usuarios normales en update/partial_update → UserUpdateSerializer (campos limitados).
        - Admins en otras acciones → AdminUserSerializer.
        - Resto → UserSerializer.
        """
        if getattr(self, 'swagger_fake_view', False):
            return UserSerializer
        is_admin = hasattr(self.request.user, 'is_admin_role') and (
            self.request.user.is_admin_role or self.request.user.is_staff
        )
        if self.action in ['update', 'partial_update']:
            return AdminUserSerializer if is_admin else UserUpdateSerializer
        if is_admin:
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me/export')
    def export_me(self, request):
        """
        Exporta los datos del usuario autenticado en formato JSON (RGPD).
        """
        from apps.bookings.models import Booking, Review

        user = request.user
        bookings_as_client = Booking.objects.select_related('service', 'professional', 'client').filter(
            client=user
        )
        bookings_as_professional = Booking.objects.select_related('service', 'professional', 'client').filter(
            professional=user
        )
        reviews = Review.objects.select_related('booking__service').filter(booking__client=user)

        payload = {
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'role': user.role,
                'specialty': user.specialty,
                'bio': user.bio,
                'gdpr_consent': user.gdpr_consent,
                'gdpr_consent_at': user.gdpr_consent_at.isoformat() if user.gdpr_consent_at else None,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat(),
            },
            'bookings_as_client': [_serialize_booking_for_export(b) for b in bookings_as_client],
            'bookings_as_professional': [_serialize_booking_for_export(b) for b in bookings_as_professional],
            'reviews_authored': [
                {
                    'id': review.id,
                    'booking_id': review.booking_id,
                    'service': review.booking.service.name,
                    'rating': review.rating,
                    'comment': review.comment,
                    'is_visible': review.is_visible,
                    'created_at': review.created_at.isoformat(),
                }
                for review in reviews
            ],
        }

        security_logger.info(
            'gdpr.export.success',
            extra={
                'event': {
                    'user_id': user.id,
                    'ip': _get_client_ip(request),
                    'path': request.path,
                    'method': request.method,
                }
            },
        )

        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated], url_path='me/delete')
    def delete_me(self, request):
        """
        Elimina lógicamente la cuenta del usuario autenticado (RGPD).

        Para conservar trazabilidad de negocio, se anonimizan datos personales,
        se desactiva la cuenta y se cancelan reservas activas asociadas.
        """
        from apps.bookings.models import Booking

        user = request.user
        current_password = request.data.get('current_password')
        if not current_password:
            security_logger.warning(
                'gdpr.delete.missing_password',
                extra={
                    'event': {
                        'user_id': user.id,
                        'ip': _get_client_ip(request),
                        'path': request.path,
                        'method': request.method,
                    }
                },
            )
            return Response(
                {'error': 'El campo current_password es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.check_password(current_password):
            security_logger.warning(
                'gdpr.delete.invalid_password',
                extra={
                    'event': {
                        'user_id': user.id,
                        'ip': _get_client_ip(request),
                        'path': request.path,
                        'method': request.method,
                    }
                },
            )
            return Response(
                {'error': 'Contrasena actual incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deletion_stamp = timezone.now().strftime('%Y%m%d%H%M%S')
        anonymized_email = f'deleted-{user.id}-{deletion_stamp}@deleted.local'

        with transaction.atomic():
            Booking.objects.filter(
                client=user,
                status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
            ).update(
                status=Booking.Status.CANCELED,
                cancellation_reason='Cuenta eliminada por solicitud RGPD (cliente).',
                canceled_by=user,
                canceled_at=timezone.now(),
            )

            Booking.objects.filter(
                professional=user,
                status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
            ).update(
                status=Booking.Status.CANCELED,
                cancellation_reason='Cuenta eliminada por solicitud RGPD (profesional).',
                canceled_by=user,
                canceled_at=timezone.now(),
            )

            user.email = anonymized_email
            user.username = f'deleted_{user.id}_{deletion_stamp}'
            user.first_name = 'Deleted'
            user.last_name = 'User'
            user.phone = ''
            user.specialty = ''
            user.bio = ''
            user.gdpr_consent = False
            user.gdpr_consent_at = None
            user.is_active = False
            user.set_unusable_password()
            if user.profile_image:
                user.profile_image.delete(save=False)
                user.profile_image = None
            user.save(
                update_fields=[
                    'email',
                    'username',
                    'first_name',
                    'last_name',
                    'phone',
                    'specialty',
                    'bio',
                    'gdpr_consent',
                    'gdpr_consent_at',
                    'is_active',
                    'password',
                    'profile_image',
                    'updated_at',
                ]
            )

        security_logger.info(
            'gdpr.delete.success',
            extra={
                'event': {
                    'user_id': user.id,
                    'ip': _get_client_ip(request),
                    'path': request.path,
                    'method': request.method,
                }
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
