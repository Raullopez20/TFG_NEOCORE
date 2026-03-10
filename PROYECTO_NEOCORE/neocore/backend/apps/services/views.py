"""
Views for service management.
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Service
from .serializers import ServiceSerializer, ServiceListSerializer, ServiceAdminSerializer
from apps.users.permissions import IsAdmin


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Service management.
    
    - Public can list and retrieve active services
    - Admins can create, update, and delete services
    """
    
    queryset = Service.objects.prefetch_related('professionals').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'duration_minutes', 'price', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceListSerializer
        if self.request.user.is_authenticated and (
            self.request.user.is_admin_role or self.request.user.is_staff
        ):
            return ServiceAdminSerializer
        return ServiceSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdmin()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Non-admins see only active services
        if not (self.request.user.is_authenticated and (
            self.request.user.is_admin_role or self.request.user.is_staff
        )):
            queryset = queryset.filter(is_active=True)
        
        return queryset
