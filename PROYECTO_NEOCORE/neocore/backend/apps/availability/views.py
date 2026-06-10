"""
Vistas (views) para la gestión de disponibilidad de profesionales.

Implementa tres ViewSets que cubren distintos aspectos de la disponibilidad:

    - AvailabilityRuleViewSet: CRUD de reglas de disponibilidad semanal.
      Los profesionales gestionan su propio horario; los admins gestionan todo.

    - TimeOffViewSet: CRUD de períodos de ausencia (vacaciones, bajas, etc.).
      Los profesionales gestionan sus propias ausencias; los admins gestionan todo.

    - AvailabilitySlotViewSet: Consulta pública de slots disponibles.
      Los clientes (o cualquier usuario) pueden consultar qué horarios
      tiene disponible un profesional para un servicio de duración determinada.

Control de acceso:
    - Reglas y ausencias: requieren autenticación (profesional o admin).
    - Slots: acceso público (AllowAny) para que los clientes puedan ver
      la disponibilidad antes de registrarse.
"""

from datetime import datetime, timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

from .models import AvailabilityRule, TimeOff
from .serializers import (
    AvailabilityRuleSerializer,
    TimeOffSerializer,
    SlotSerializer,
)
from .services import AvailabilityService
from apps.users.permissions import IsProfessional, IsAdmin


class AvailabilityRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de reglas de disponibilidad semanal.

    Permite a los profesionales definir en qué días y horarios
    aceptan citas. Los administradores pueden gestionar las reglas
    de cualquier profesional.

    Filtros disponibles (vía query params):
        - professional: Filtrar por ID del profesional.
        - day_of_week: Filtrar por día de la semana (0-6).
        - is_active: Filtrar por estado activo/inactivo.
    """
    
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['professional', 'day_of_week', 'is_active']
    
    def get_queryset(self):
        """
        Devuelve las reglas visibles para el usuario actual.

        - Admin/staff: todas las reglas del sistema.
        - Profesional: solo sus propias reglas.
        - Otros roles: ninguna regla.
        """
        # Retornar queryset vacío para la generación del esquema OpenAPI
        if getattr(self, 'swagger_fake_view', False):
            return AvailabilityRule.objects.none()
        
        user = self.request.user
        
        # Administradores ven todas las reglas
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return AvailabilityRule.objects.all()
        
        # Profesionales solo ven sus propias reglas
        if hasattr(user, 'is_professional') and user.is_professional:
            return AvailabilityRule.objects.filter(professional=user)
        
        return AvailabilityRule.objects.none()
    
    def perform_create(self, serializer):
        """
        Al crear una regla, si el usuario no es admin,
        se asigna automáticamente como profesional propietario.
        Los admins pueden especificar cualquier profesional.
        """
        user = self.request.user
        if not (hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff)):
            serializer.save(professional=self.request.user)
        else:
            serializer.save()


class TimeOffViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de períodos de ausencia.

    Permite a los profesionales registrar períodos en los que no
    estarán disponibles (vacaciones, baja médica, etc.). Los
    administradores pueden gestionar las ausencias de cualquier profesional.

    Filtros disponibles:
        - professional: Filtrar por ID del profesional.
    """
    
    serializer_class = TimeOffSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['professional']
    
    def get_queryset(self):
        """
        Devuelve las ausencias visibles para el usuario actual.

        - Admin/staff: todas las ausencias del sistema.
        - Profesional: solo sus propias ausencias.
        - Otros roles: ninguna ausencia.
        """
        # Retornar queryset vacío para la generación del esquema OpenAPI
        if getattr(self, 'swagger_fake_view', False):
            return TimeOff.objects.none()
        
        user = self.request.user
        
        # Administradores ven todas las ausencias
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return TimeOff.objects.all()
        
        # Profesionales solo ven sus propias ausencias
        if hasattr(user, 'is_professional') and user.is_professional:
            return TimeOff.objects.filter(professional=user)
        
        return TimeOff.objects.none()
    
    def perform_create(self, serializer):
        """
        Al crear una ausencia, si el usuario no es admin,
        se asigna automáticamente como profesional propietario.
        Los admins pueden especificar cualquier profesional.
        """
        user = self.request.user
        if not (hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff)):
            serializer.save(professional=self.request.user)
        else:
            serializer.save()


class AvailabilitySlotViewSet(viewsets.ViewSet):
    """
    ViewSet para consultar los slots de tiempo disponibles.

    Endpoint público (sin autenticación) que permite a los clientes
    ver qué horarios tiene disponible un profesional para un servicio
    de duración determinada dentro de un rango de fechas.

    No tiene operaciones CRUD propias — solo expone la acción get_slots.
    """
    
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def get_slots(self, request):
        """
        Obtiene los slots disponibles para un profesional y servicio.

        Parámetros de consulta (query params):
            - professional_id (obligatorio): ID del profesional.
            - service_duration (obligatorio): Duración del servicio en minutos.
            - start_date (opcional): Fecha de inicio (formato YYYY-MM-DD).
              Por defecto: fecha actual.
            - end_date (opcional): Fecha de fin (formato YYYY-MM-DD).
              Por defecto: 14 días desde start_date.

        Respuesta:
            JSON con professional_id, service_duration, rango de fechas
            y lista de slots disponibles con start_datetime y end_datetime.
        """
        professional_id = request.query_params.get('professional_id')
        service_duration = request.query_params.get('service_duration')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Validar parámetros obligatorios
        if not professional_id:
            return Response(
                {'error': 'professional_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not service_duration:
            return Response(
                {'error': 'service_duration is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convertir a enteros validando el formato
        try:
            professional_id = int(professional_id)
            service_duration = int(service_duration)
        except ValueError:
            return Response(
                {'error': 'Invalid parameter format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if professional_id <= 0:
            return Response({'error': 'professional_id invalido'}, status=status.HTTP_400_BAD_REQUEST)
        if service_duration < 15 or service_duration > 240:
            return Response({'error': 'service_duration fuera de rango (15-240 minutos)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parsear fechas con valores por defecto
        try:
            if start_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            else:
                start_date = timezone.now().date()
            
            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            else:
                # Por defecto, 14 días desde la fecha de inicio
                end_date = start_date + timedelta(days=14)
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if end_date < start_date:
            return Response({'error': 'end_date no puede ser anterior a start_date'}, status=status.HTTP_400_BAD_REQUEST)
        if (end_date - start_date).days > 31:
            return Response({'error': 'El rango maximo permitido es de 31 dias'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generar los slots disponibles mediante el servicio de disponibilidad
        slots = AvailabilityService.get_available_slots(
            professional_id=professional_id,
            service_duration=service_duration,
            start_date=start_date,
            end_date=end_date
        )
        
        # Serializar y devolver la respuesta con metadatos del rango
        serializer = SlotSerializer(slots, many=True)
        return Response({
            'professional_id': professional_id,
            'service_duration': service_duration,
            'start_date': start_date,
            'end_date': end_date,
            'slots': serializer.data
        })
