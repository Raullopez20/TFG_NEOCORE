"""
Views for availability management.
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
    ViewSet for managing availability rules.
    
    - Professionals can manage their own rules
    - Admins can manage all rules
    """
    
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['professional', 'day_of_week', 'is_active']
    
    def get_queryset(self):
        # Handle schema generation
        if getattr(self, 'swagger_fake_view', False):
            return AvailabilityRule.objects.none()
        
        user = self.request.user
        
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return AvailabilityRule.objects.all()
        
        if hasattr(user, 'is_professional') and user.is_professional:
            return AvailabilityRule.objects.filter(professional=user)
        
        return AvailabilityRule.objects.none()
    
    def perform_create(self, serializer):
        # If not admin, force professional to be current user
        user = self.request.user
        if not (hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff)):
            serializer.save(professional=self.request.user)
        else:
            serializer.save()


class TimeOffViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing time-off periods.
    
    - Professionals can manage their own time-off
    - Admins can manage all time-off
    """
    
    serializer_class = TimeOffSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['professional']
    
    def get_queryset(self):
        # Handle schema generation
        if getattr(self, 'swagger_fake_view', False):
            return TimeOff.objects.none()
        
        user = self.request.user
        
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return TimeOff.objects.all()
        
        if hasattr(user, 'is_professional') and user.is_professional:
            return TimeOff.objects.filter(professional=user)
        
        return TimeOff.objects.none()
    
    def perform_create(self, serializer):
        # If not admin, force professional to be current user
        user = self.request.user
        if not (hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff)):
            serializer.save(professional=self.request.user)
        else:
            serializer.save()


class AvailabilitySlotViewSet(viewsets.ViewSet):
    """
    ViewSet for retrieving available time slots.
    
    Public endpoint for clients to view available slots.
    """
    
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def get_slots(self, request):
        """
        Get available slots for a professional and service.
        
        Query params:
            - professional_id (required): ID of the professional
            - service_duration (required): Duration in minutes
            - start_date (optional): Start date (default: today)
            - end_date (optional): End date (default: 14 days from start)
        """
        professional_id = request.query_params.get('professional_id')
        service_duration = request.query_params.get('service_duration')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Validate required parameters
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
        
        try:
            professional_id = int(professional_id)
            service_duration = int(service_duration)
        except ValueError:
            return Response(
                {'error': 'Invalid parameter format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse dates
        try:
            if start_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            else:
                start_date = timezone.now().date()
            
            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            else:
                end_date = start_date + timedelta(days=14)
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate slots
        slots = AvailabilityService.get_available_slots(
            professional_id=professional_id,
            service_duration=service_duration,
            start_date=start_date,
            end_date=end_date
        )
        
        # Serialize and return
        serializer = SlotSerializer(slots, many=True)
        return Response({
            'professional_id': professional_id,
            'service_duration': service_duration,
            'start_date': start_date,
            'end_date': end_date,
            'slots': serializer.data
        })
