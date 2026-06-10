"""
Configuración de URLs para la app de servicios.

Registra el ViewSet de servicios en un router de DRF que genera
automáticamente los endpoints CRUD:
    - GET    /api/services/       -> Listar servicios activos
    - POST   /api/services/       -> Crear servicio (solo admin)
    - GET    /api/services/{id}/  -> Detalle de un servicio
    - PUT    /api/services/{id}/  -> Actualizar servicio (solo admin)
    - DELETE /api/services/{id}/  -> Eliminar servicio (solo admin)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ServiceViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')

urlpatterns = [
    path('', include(router.urls)),
]
