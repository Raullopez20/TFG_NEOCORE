"""
Configuración principal de URLs del proyecto NeoCore.
"""

from django.conf import settings
from django.contrib import admin
from django.urls import path, include
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
    return Response({'status': 'ok'}, status=status.HTTP_200_OK)


# ==========================================================================
# DEFINICIÓN DE RUTAS
# ==========================================================================
urlpatterns = [
    # --- Honeypot para bots en ruta admin por defecto ---
    path('admin/', include('admin_honeypot.urls', namespace='admin_honeypot')),
    # --- Panel de administración real en ruta no obvia ---
    path(settings.ADMIN_PATH, admin.site.urls),

    # --- Comprobación de estado ---
    path('api/health/', health_check, name='health-check'),
    path('api/health', health_check, name='health-check-noslash'),

    # --- Documentación de la API (Swagger/OpenAPI) ---
    # Doble registro (con y sin slash) para evitar el 308 de Vercel que rompe Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema', SpectacularAPIView.as_view(), name='schema-noslash'),
    # url='/api/schema' (sin slash) para que Swagger UI no reciba el 308 de Vercel
    path('api/docs/', SpectacularSwaggerView.as_view(url='/api/schema'), name='swagger-ui'),
    path('api/docs', SpectacularSwaggerView.as_view(url='/api/schema'), name='swagger-ui-noslash'),

    # --- Autenticación (login, registro, contraseñas, OAuth) ---
    path('api/auth/', include('apps.users.urls')),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('apps.notifications.urls')),

    # --- Endpoints de las apps del proyecto ---
    path('api/', include('apps.services.urls')),
    path('api/', include('apps.bookings.urls')),
    path('api/', include('apps.availability.urls')),
]

# Archivos estáticos en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Servir media siempre desde Django — en Vercel el rewrite /media/* apunta aquí.
# Con Cloudinary configurado, Django devuelve la URL de CDN directamente (no pasa
# por aquí). Sin Cloudinary, sirve desde /tmp/media (funcional en la misma instancia).
if not getattr(settings, 'DEFAULT_FILE_STORAGE', '').startswith('cloudinary'):
    from django.views.static import serve as _serve
    urlpatterns += [
        path('media/<path:path>', _serve, {'document_root': settings.MEDIA_ROOT}),
    ]

# ==========================================================================
# PERSONALIZACIÓN DEL PANEL DE ADMINISTRACIÓN
# ==========================================================================
admin.site.site_header = "NeoCore Administration"
admin.site.site_title = "NeoCore Admin"
admin.site.index_title = "Welcome to NeoCore Admin Panel"
