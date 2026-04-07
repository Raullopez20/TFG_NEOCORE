"""
Configuración de URLs para la app de usuarios.

Define los endpoints relacionados con la autenticación y gestión de usuarios:
    - /csrf/                      -> Obtener token CSRF
    - /register/                  -> Registro de nuevos usuarios
    - /login/                     -> Inicio de sesión (devuelve tokens JWT)
    - /logout/                    -> Cierre de sesión
    - /password/change/           -> Cambio de contraseña
    - /password/reset/            -> Solicitud de restablecimiento de contraseña
    - /password/reset/confirm/    -> Confirmación del restablecimiento
    - /users/                     -> CRUD de usuarios (según permisos)
    - /users/me/                  -> Perfil del usuario autenticado
    - /users/professionals/       -> Listado público de profesionales
    - /social/                    -> Autenticación social (Google OAuth)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dj_rest_auth.views import PasswordChangeView, PasswordResetView, PasswordResetConfirmView
from rest_framework_simplejwt.views import TokenRefreshView
from django.middleware.csrf import get_token
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .views import UserViewSet
from .security_views import SecureLoginView, SecureLogoutView, SecureRegisterView
from .intermodular_views import (
    PublicDashboardView,
    AuthenticatedDashboardView,
    AdminDashboardView,
    PublicStatusAPIView,
    AuthenticatedUserAPIView,
    AdminOnlyAPIView,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token(request):
    """
    Endpoint para obtener el token CSRF.

    El frontend necesita este token para incluirlo en las peticiones
    que modifiquen datos (POST, PUT, DELETE) cuando la protección
    CSRF está activa (solo en producción).

    Retorna:
        JsonResponse: {'csrfToken': '<token_csrf>'}
    """
    return JsonResponse({'csrfToken': get_token(request)})


# Registro del ViewSet de usuarios en el router de DRF.
# Genera automáticamente las rutas CRUD: /users/, /users/{id}/, etc.
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # --- Intermodular MVC (CBV con mixins de autenticación/autorización) ---
    path('intermodular/mvc/public/', PublicDashboardView.as_view(), name='intermodular_mvc_public'),
    path('intermodular/mvc/auth/', AuthenticatedDashboardView.as_view(), name='intermodular_mvc_auth'),
    path('intermodular/mvc/admin/', AdminDashboardView.as_view(), name='intermodular_mvc_admin'),

    # --- Intermodular API (APIView con permisos DRF) ---
    path('intermodular/api/public/', PublicStatusAPIView.as_view(), name='intermodular_api_public'),
    path('intermodular/api/auth/', AuthenticatedUserAPIView.as_view(), name='intermodular_api_auth'),
    path('intermodular/api/admin/', AdminOnlyAPIView.as_view(), name='intermodular_api_admin'),

    # --- Token CSRF ---
    path('csrf/', csrf_token, name='csrf_token'),

    # --- Endpoints de autenticación (proporcionados por dj-rest-auth) ---
    path('register/', SecureRegisterView.as_view(), name='rest_register'),
    path('login/', SecureLoginView.as_view(), name='rest_login'),
    path('logout/', SecureLogoutView.as_view(), name='rest_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password/change/', PasswordChangeView.as_view(), name='rest_password_change'),
    path('password/reset/', PasswordResetView.as_view(), name='rest_password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='rest_password_reset_confirm'),

    # --- Gestión de usuarios (ViewSet con router) ---
    path('', include(router.urls)),

    # --- Autenticación social (Google OAuth) ---
    path('social/', include('allauth.urls')),
]
