"""
Views for booking management.
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

from .models import Booking
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingUpdateSerializer,
    BookingListSerializer,
    BookingStatsSerializer,
)
from apps.users.permissions import IsAdmin


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for booking management.
    
    Endpoints:
        - list/create: Clients see their bookings, professionals see bookings assigned to them
        - retrieve/update/destroy: Access control per user role
        - confirm/reject: Professional-only actions
        - cancel: Client or professional can cancel
        - stats: Admin-only statistics
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service', 'professional', 'client']
    search_fields = ['client__first_name', 'client__last_name', 'professional__first_name', 'professional__last_name', 'service__name']
    ordering_fields = ['start_datetime', 'created_at', 'status']
    ordering = ['-start_datetime']
    
    def get_queryset(self):
        # Handle schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        
        user = self.request.user
        
        # Admin sees all bookings
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return Booking.objects.select_related(
                'client', 'professional', 'service'
            ).all()
        
        # Professional sees their bookings
        if hasattr(user, 'is_professional') and user.is_professional:
            return Booking.objects.select_related(
                'client', 'professional', 'service'
            ).filter(professional=user)
        
        # Client sees their bookings
        return Booking.objects.select_related(
            'client', 'professional', 'service'
        ).filter(client=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        if self.action in ['update', 'partial_update']:
            return BookingUpdateSerializer
        if self.action == 'list':
            return BookingListSerializer
        return BookingSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new booking (clients only)."""
        if not request.user.is_client:
            return Response(
                {'error': 'Only clients can create bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a pending booking (professionals only)."""
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
        """Reject a pending booking (professionals only)."""
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
        
        booking.status = Booking.Status.REJECTED
        booking.cancellation_reason = request.data.get('reason', '')
        booking.canceled_by = request.user
        booking.canceled_at = timezone.now()
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking (client or professional)."""
        booking = self.get_object()
        
        # Check permissions
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
        
        booking.status = Booking.Status.CANCELED
        booking.cancellation_reason = request.data.get('reason', '')
        booking.canceled_by = request.user
        booking.canceled_at = timezone.now()
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def mark_done(self, request, pk=None):
        """Mark booking as done (professionals only)."""
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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        """Get booking statistics (admin only)."""
        # Get date range from query params
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        bookings = Booking.objects.filter(created_at__gte=start_date)
        
        # Overall stats
        total_bookings = bookings.count()
        status_counts = bookings.values('status').annotate(count=Count('id'))
        
        pending = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.PENDING)
        confirmed = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.CONFIRMED)
        completed = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.DONE)
        canceled = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.CANCELED)
        rejected = sum(s['count'] for s in status_counts if s['status'] == Booking.Status.REJECTED)
        
        # By service
        by_service = bookings.values('service__name').annotate(count=Count('id'))
        bookings_by_service = {item['service__name']: item['count'] for item in by_service}
        
        # By professional
        by_professional = bookings.values('professional__first_name', 'professional__last_name').annotate(count=Count('id'))
        bookings_by_professional = {
            f"{item['professional__first_name']} {item['professional__last_name']}": item['count']
            for item in by_professional
        }
        
        # Time-based
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
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming bookings for the current user."""
        queryset = self.get_queryset().filter(
            start_datetime__gte=timezone.now(),
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED]
        ).order_by('start_datetime')
        
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def past(self, request):
        """Get past bookings for the current user."""
        queryset = self.get_queryset().filter(
            end_datetime__lt=timezone.now()
        ).order_by('-start_datetime')
        
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)
