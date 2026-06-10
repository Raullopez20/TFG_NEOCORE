"""
Vistas (views) para la gesti\u00f3n de reservas (bookings).

Implementa un ViewSet completo con operaciones CRUD y acciones
personalizadas que cubren todo el ciclo de vida de una reserva:

    Acciones est\u00e1ndar:
        - list:     Listar reservas (filtradas por rol del usuario).
        - create:   Crear nueva reserva (solo clientes).
        - retrieve: Ver detalle de una reserva.
        - update:   Actualizar notas de la reserva.

    Acciones de cambio de estado:
        - confirm:   Confirmar reserva pendiente (solo profesionales).
        - reject:    Rechazar reserva pendiente (solo profesionales).
        - cancel:    Cancelar reserva (cliente, profesional o admin).
        - mark_done: Marcar como completada (solo profesionales).

    Acciones de consulta:
        - upcoming: Reservas pr\u00f3ximas del usuario actual.
        - past:     Reservas pasadas del usuario actual.
        - stats:    Estad\u00edsticas globales (solo administradores).

Control de acceso:
    - Los clientes solo ven y gestionan sus propias reservas.
    - Los profesionales ven las reservas donde son el profesional asignado.
    - Los administradores ven y gestionan todas las reservas.
"""

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Booking, Review
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingUpdateSerializer,
    BookingListSerializer,
    BookingStatsSerializer,
    ReviewSerializer,
    ReviewCreateSerializer,
)
from apps.users.permissions import IsAdmin
from bleach import clean
from rest_framework.permissions import AllowAny


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet principal para la gesti\u00f3n de reservas.

    Proporciona endpoints CRUD completos m\u00e1s acciones personalizadas
    para el flujo de estados de las reservas. Cada usuario solo puede
    ver y operar sobre las reservas que le corresponden seg\u00fan su rol.

    Filtros disponibles (v\u00eda query params):
        - status: Filtrar por estado (PENDING, CONFIRMED, etc.).
        - service: Filtrar por ID del servicio.
        - professional: Filtrar por ID del profesional.
        - client: Filtrar por ID del cliente.

    B\u00fasqueda (v\u00eda ?search=):
        Busca por nombre/apellido del cliente o profesional, o por
        nombre del servicio.

    Ordenaci\u00f3n (v\u00eda ?ordering=):
        Campos disponibles: start_datetime, created_at, status.
        Por defecto: -start_datetime (m\u00e1s recientes primero).
    """
    
    permission_classes = [IsAuthenticated]
    # Backends de filtrado: filtros exactos, b\u00fasqueda por texto y ordenaci\u00f3n
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service', 'professional', 'client']
    search_fields = ['client__first_name', 'client__last_name', 'professional__first_name', 'professional__last_name', 'service__name']
    ordering_fields = ['start_datetime', 'created_at', 'status']
    ordering = ['-start_datetime']
    
    def get_queryset(self):
        """
        Devuelve las reservas visibles para el usuario actual.

        Aplica select_related para cargar las relaciones en una sola
        consulta SQL y evitar el problema N+1 en las vistas de listado.

        Reglas de visibilidad:
            - Admin/staff: todas las reservas del sistema.
            - Profesional: solo las reservas donde es el profesional asignado.
            - Cliente: solo las reservas donde es el cliente.
        """
        # Retornar queryset vac\u00edo para la generaci\u00f3n del esquema OpenAPI
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        
        user = self.request.user
        
        # Administradores y staff ven todas las reservas
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return Booking.objects.select_related(
                'client', 'professional', 'service'
            ).all()
        
        # Los profesionales ven las reservas que tienen asignadas
        if hasattr(user, 'is_professional') and user.is_professional:
            return Booking.objects.select_related(
                'client', 'professional', 'service'
            ).filter(professional=user)
        
        # Los clientes ven sus propias reservas
        return Booking.objects.select_related(
            'client', 'professional', 'service'
        ).filter(client=user)
    
    def get_serializer_class(self):
        """
        Selecciona el serializador apropiado seg\u00fan la acci\u00f3n solicitada.

        - create: BookingCreateSerializer (con validaciones de disponibilidad).
        - update/partial_update: BookingUpdateSerializer (solo notas).
        - list, upcoming, past: BookingSerializer para que el frontend reciba
          client_info, professional_info y service_info en listados.
        - Resto: BookingSerializer (vista completa con relaciones).
        """
        if self.action == 'create':
            return BookingCreateSerializer
        if self.action in ['update', 'partial_update']:
            return BookingUpdateSerializer
        if self.action in ['list', 'upcoming', 'past']:
            return BookingSerializer
        return BookingSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Crea una nueva reserva (solo clientes).

        Verifica que el usuario sea un cliente antes de procesar la solicitud.
        El serializador se encarga de validar la disponibilidad del slot
        y asignar autom\u00e1ticamente al cliente desde el usuario autenticado.
        Devuelve la reserva completa con datos anidados (BookingSerializer).
        """
        if not request.user.is_client:
            return Response(
                {'error': 'Only clients can create bookings'},
                status=status.HTTP_403_FORBIDDEN
            )

        last_hour = timezone.now() - timedelta(hours=1)
        recent_bookings = Booking.objects.filter(
            client=request.user,
            created_at__gte=last_hour,
        ).count()
        if recent_bookings >= 10:
            return Response(
                {'detail': 'Has superado el limite de 10 reservas por hora.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        
        # Responder con la vista completa de la reserva reci\u00e9n creada
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )
    
    # =========================================================================
    # Acciones de cambio de estado
    # =========================================================================
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirma una reserva pendiente (solo profesionales).

        Verifica que:
            1. El usuario sea un profesional.
            2. La reserva pertenezca a ese profesional.
            3. La reserva est\u00e9 en un estado que permita confirmaci\u00f3n (PENDING).

        Transici\u00f3n de estado: PENDING -> CONFIRMED.
        """
        booking = self.get_object()
        
        if not request.user.is_professional:
            return Response(
                {'error': 'Only professionals can confirm bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.professional != request.user:
            return Response(
                {'error': 'You can only confirm your own bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not booking.can_be_confirmed():
            return Response(
                {'error': f'Booking cannot be confirmed (current status: {booking.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.Status.CONFIRMED
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Rechaza una reserva pendiente (solo profesionales).

        Verifica que:
            1. El usuario sea un profesional.
            2. La reserva pertenezca a ese profesional.
            3. La reserva est\u00e9 en un estado que permita rechazo (PENDING).

        Registra el motivo del rechazo, qui\u00e9n lo realiz\u00f3 y la fecha.
        Transici\u00f3n de estado: PENDING -> REJECTED.
        """
        booking = self.get_object()
        
        if not request.user.is_professional:
            return Response(
                {'error': 'Only professionals can reject bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.professional != request.user:
            return Response(
                {'error': 'You can only reject your own bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not booking.can_be_rejected():
            return Response(
                {'error': f'Booking cannot be rejected (current status: {booking.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar estado y registrar datos de rechazo
        booking.status = Booking.Status.REJECTED
        booking.cancellation_reason = clean(request.data.get('reason', ''), tags=[], attributes={}, strip=True)
        booking.canceled_by = request.user
        booking.canceled_at = timezone.now()
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancela una reserva (cliente, profesional o administrador).

        Tanto el cliente como el profesional asignado pueden cancelar
        sus reservas. Los administradores pueden cancelar cualquier reserva.

        Registra el motivo de cancelaci\u00f3n, qui\u00e9n la cancel\u00f3 y la fecha.
        Transici\u00f3n de estado: PENDING|CONFIRMED -> CANCELED.
        """
        booking = self.get_object()
        
        # Verificar que el usuario sea parte de la reserva o sea admin
        if booking.client != request.user and booking.professional != request.user:
            if not (request.user.is_admin_role or request.user.is_staff):
                return Response(
                    {'error': 'You can only cancel your own bookings'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        if not booking.can_be_canceled():
            return Response(
                {'error': f'Booking cannot be canceled (current status: {booking.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar estado y registrar datos de cancelaci\u00f3n
        booking.status = Booking.Status.CANCELED
        booking.cancellation_reason = clean(request.data.get('reason', ''), tags=[], attributes={}, strip=True)
        booking.canceled_by = request.user
        booking.canceled_at = timezone.now()
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def mark_done(self, request, pk=None):
        """
        Marca una reserva confirmada como completada (solo profesionales).

        Solo las reservas con estado CONFIRMED pueden marcarse como hechas.
        Verifica que el usuario sea el profesional asignado a la reserva.
        Transici\u00f3n de estado: CONFIRMED -> DONE.
        """
        booking = self.get_object()
        
        if not request.user.is_professional:
            return Response(
                {'error': 'Only professionals can mark bookings as done'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.professional != request.user:
            return Response(
                {'error': 'You can only mark your own bookings as done'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != Booking.Status.CONFIRMED:
            return Response(
                {'error': 'Only confirmed bookings can be marked as done'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.Status.DONE
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    # =========================================================================
    # Acciones de consulta
    # =========================================================================
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        """
        Obtiene estad\u00edsticas globales de reservas (solo administradores).

        Par\u00e1metros de consulta:
            - days (int, default=30): N\u00famero de d\u00edas hacia atr\u00e1s a analizar.

        Devuelve:
            - Totales por estado (pendientes, confirmadas, completadas, etc.).
            - Agrupaci\u00f3n por servicio y por profesional.
            - Reservas de la \u00faltima semana y \u00faltimo mes.
        """
        # Obtener el rango de d\u00edas desde los query params (por defecto 30)
        try:
            days = int(request.query_params.get('days', 30))
        except ValueError:
            return Response({'error': 'Parametro days invalido'}, status=status.HTTP_400_BAD_REQUEST)
        if days < 1 or days > 365:
            return Response({'error': 'Parametro days fuera de rango (1-365)'}, status=status.HTTP_400_BAD_REQUEST)
        start_date = timezone.now() - timedelta(days=days)
        
        bookings = Booking.objects.filter(created_at__gte=start_date)
        
        # Contadores generales por estado
        total_bookings = bookings.count()
        status_counts = bookings.values('status').annotate(count=Count('id'))
        
        pending = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.PENDING)
        confirmed = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.CONFIRMED)
        completed = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.DONE)
        canceled = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.CANCELED)
        rejected = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.REJECTED)
        
        # Agrupaci\u00f3n por nombre de servicio
        by_service = bookings.values('service__name').annotate(count=Count('id'))
        bookings_by_service = {item['service__name']: item['count'] for item in by_service}
        
        # Agrupaci\u00f3n por nombre completo del profesional
        by_professional = bookings.values('professional__first_name', 'professional__last_name').annotate(count=Count('id'))
        bookings_by_professional = {
            f"{item['professional__first_name']} {item['professional__last_name']}": item['count']
            for item in by_professional
        }
        
        # M\u00e9tricas temporales: \u00faltima semana y \u00faltimo mes
        week_ago = timezone.now() - timedelta(days=7)
        month_ago = timezone.now() - timedelta(days=30)
        
        bookings_this_week = bookings.filter(created_at__gte=week_ago).count()
        bookings_this_month = bookings.filter(created_at__gte=month_ago).count()
        
        stats_data = {
            'total_bookings': total_bookings,
            'pending_bookings': pending,
            'confirmed_bookings': confirmed,
            'completed_bookings': completed,
            'canceled_bookings': canceled,
            'rejected_bookings': rejected,
            'bookings_by_service': bookings_by_service,
            'bookings_by_professional': bookings_by_professional,
            'bookings_this_week': bookings_this_week,
            'bookings_this_month': bookings_this_month,
        }
        
        serializer = BookingStatsSerializer(data=stats_data)
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_stats(self, request):
        """Estadísticas de reservas del usuario autenticado (cualquier rol)."""
        user = request.user
        if user.role == 'PROFESSIONAL':
            qs = Booking.objects.filter(professional=user)
        else:
            qs = Booking.objects.filter(client=user)

        now = timezone.now()
        total = qs.count()
        completed = qs.filter(status=Booking.Status.DONE).count()
        upcoming = qs.filter(
            status__in=[Booking.Status.CONFIRMED, Booking.Status.PENDING],
            start_datetime__gt=now,
        ).count()
        pending = qs.filter(status=Booking.Status.PENDING).count()
        canceled = qs.filter(status=Booking.Status.CANCELED).count()

        return Response({
            'total': total,
            'completed': completed,
            'upcoming': upcoming,
            'pending': pending,
            'canceled': canceled,
        })

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Devuelve las reservas pr\u00f3ximas del usuario actual.

        Filtra reservas cuya fecha de inicio sea futura y cuyo estado
        sea PENDING o CONFIRMED (es decir, a\u00fan vigentes).
        Ordenadas cronol\u00f3gicamente (m\u00e1s cercana primero).
        """
        queryset = self.get_queryset().filter(
            start_datetime__gte=timezone.now(),
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED]
        ).order_by('start_datetime')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def past(self, request):
        """
        Devuelve las reservas pasadas del usuario actual.

        Filtra reservas cuya fecha de fin ya haya pasado,
        sin importar el estado. Ordenadas por fecha descendente
        (m\u00e1s recientes primero).
        """
        queryset = self.get_queryset().filter(
            end_datetime__lt=timezone.now()
        ).order_by('-start_datetime')

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet para reseñas de citas completadas.

    Reglas de acceso:
        - list / retrieve: público (AllowAny). Solo se devuelven reseñas
          con is_visible=True. Útil para mostrar testimonios en la landing
          y opiniones en el perfil del profesional.
        - create: solo el cliente dueño de la booking, y solo si la cita
          está en estado DONE.
        - destroy: solo administradores (moderación).
        - update / partial_update: deshabilitados (las reseñas no se editan).

    Filtros:
        - ?professional=<id>  → reseñas de un profesional concreto
        - ?booking=<id>       → reseña de una reserva concreta
    """

    queryset = Review.objects.select_related(
        'booking', 'booking__client', 'booking__professional', 'booking__service'
    ).all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['booking']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Review.objects.none()
        qs = Review.objects.select_related(
            'booking', 'booking__client', 'booking__professional', 'booking__service'
        )
        # Lecturas públicas: solo reseñas visibles
        if self.action in ['list', 'retrieve']:
            user = self.request.user if self.request.user.is_authenticated else None
            if not (user and (user.is_staff or getattr(user, 'is_admin_role', False))):
                qs = qs.filter(is_visible=True)
        # Filtro adicional por profesional (no es campo directo del Review)
        professional_id = self.request.query_params.get('professional')
        if professional_id:
            qs = qs.filter(booking__professional_id=professional_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action == 'destroy':
            return [IsAdmin()]
        # create, update, partial_update
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Las reseñas no se pueden editar.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Las reseñas no se pueden editar.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )
