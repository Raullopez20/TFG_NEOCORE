"""
URL configuration for users app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dj_rest_auth.views import (
    LoginView,
    LogoutView,
    PasswordChangeView,
    PasswordResetView,
    PasswordResetConfirmView,
)
from dj_rest_auth.registration.views import RegisterView
from django.middleware.csrf import get_token
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .views import UserViewSet

@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token(request):
    """Get CSRF token."""
    return JsonResponse({'csrfToken': get_token(request)})

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # CSRF token endpoint
    path('csrf/', csrf_token, name='csrf_token'),
    
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='rest_register'),
    path('login/', LoginView.as_view(), name='rest_login'),
    path('logout/', LogoutView.as_view(), name='rest_logout'),
    path('password/change/', PasswordChangeView.as_view(), name='rest_password_change'),
    path('password/reset/', PasswordResetView.as_view(), name='rest_password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='rest_password_reset_confirm'),
    
    # User management
    path('', include(router.urls)),
    
    # Social auth (Google)
    path('social/', include('allauth.urls')),
]
