"""
Configuración principal de URLs del proyecto NeoCore.

Este archivo define el enrutamiento raíz de la aplicación, mapeando las URLs
a las vistas y módulos correspondientes. Actúa como punto de entrada para
todas las peticiones HTTP y las distribuye a las apps apropiadas.

Estructura de la API:
    /admin/               -> Panel de administración de Django
    /api/health/          -> Endpoint de comprobación de estado (health check)
    /api/schema/          -> Esquema OpenAPI generado automáticamente
    /api/docs/            -> Documentación interactiva Swagger UI
    /api/auth/            -> Endpoints de autenticación (login, registro, etc.)
    /api/services/        -> CRUD de servicios del centro
    /api/bookings/        -> CRUD de reservas y citas
    /api/availability/    -> Gestión de disponibilidad horaria
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint de comprobación de estado del servidor.

    Devuelve un JSON con status 'ok' si el servidor está funcionando
    correctamente. Es utilizado por los sistemas de monitorización
    y los balanceadores de carga para verificar la salud del servicio.

    Retorna:
        Response: {'status': 'ok'} con código HTTP 200
    """
    return Response({'status': 'ok'}, status=status.HTTP_200_OK)


# ==========================================================================
# DEFINICIÓN DE RUTAS
# ==========================================================================
urlpatterns = [
    # --- Panel de administración ---
    path('admin/', admin.site.urls),
    
    # --- Comprobación de estado ---
    path('api/health/', health_check, name='health-check'),
    
    # --- Documentación de la API (Swagger/OpenAPI) ---
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # --- Autenticación (login, registro, contraseñas, OAuth) ---
    path('api/auth/', include('apps.users.urls')),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # --- Endpoints de las apps del proyecto ---
    path('api/', include('apps.services.urls')),      # Servicios ofrecidos
    path('api/', include('apps.bookings.urls')),       # Reservas y citas
    path('api/', include('apps.availability.urls')),   # Disponibilidad horaria
]

# En modo desarrollo, Django sirve los archivos multimedia y estáticos directamente.
# En producción, estos archivos son servidos por Nginx o WhiteNoise.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# ==========================================================================
# PERSONALIZACIÓN DEL PANEL DE ADMINISTRACIÓN
# ==========================================================================
admin.site.site_header = "NeoCore Administration"
admin.site.site_title = "NeoCore Admin"
admin.site.index_title = "Welcome to NeoCore Admin Panel"
