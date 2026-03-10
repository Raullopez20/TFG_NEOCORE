"""
Views for user management and authentication.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .serializers import (
    UserSerializer,
    ProfessionalSerializer,
    UserUpdateSerializer,
    AdminUserSerializer,
)
from .permissions import IsOwnerOrAdmin, IsAdmin

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.
    
    - Clients can view and update their own profile
    - Admins can manage all users
    - Public can view professionals list
    """
    
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'specialty', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'specialty']
    ordering_fields = ['created_at', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        # Handle schema generation
        if getattr(self, 'swagger_fake_view', False):
            return UserSerializer
        if hasattr(self.request.user, 'is_admin_role') and (self.request.user.is_admin_role or self.request.user.is_staff):
            return AdminUserSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action == 'professionals':
            return [AllowAny()]
        if self.action in ['list', 'create', 'destroy']:
            return [IsAdmin()]
        if self.action in ['update', 'partial_update', 'retrieve']:
            return [IsOwnerOrAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        # Handle schema generation
        if getattr(self, 'swagger_fake_view', False):
            return User.objects.none()
        
        user = self.request.user
        
        # Admins see all users
        if hasattr(user, 'is_admin_role') and (user.is_admin_role or user.is_staff):
            return User.objects.all()
        
        # Other users see only themselves
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current authenticated user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_me(self, request):
        """Update current authenticated user."""
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
        List all active professionals.
        Public endpoint for browsing available professionals.
        """
        queryset = User.objects.filter(
            role=User.Role.PROFESSIONAL,
            is_active=True
        )
        
        # Filter by specialty if provided
        specialty = request.query_params.get('specialty')
        if specialty:
            queryset = queryset.filter(specialty__icontains=specialty)
        
        serializer = ProfessionalSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def professional_detail(self, request, pk=None):
        """Get detailed professional profile."""
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
