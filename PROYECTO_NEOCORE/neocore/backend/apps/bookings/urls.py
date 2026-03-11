"""
Configuración de URLs para la app de reservas (bookings).

Registra el ViewSet de reservas en un router de DRF que genera
automáticamente los endpoints CRUD y las acciones personalizadas:
    - GET    /api/bookings/                 -> Listar reservas del usuario
    - POST   /api/bookings/                 -> Crear nueva reserva (clientes)
    - GET    /api/bookings/{id}/            -> Detalle de una reserva
    - POST   /api/bookings/{id}/confirm/    -> Confirmar (profesionales)
    - POST   /api/bookings/{id}/reject/     -> Rechazar (profesionales)
    - POST   /api/bookings/{id}/cancel/     -> Cancelar (ambos)
    - POST   /api/bookings/{id}/mark_done/  -> Marcar completada (profesionales)
    - GET    /api/bookings/upcoming/        -> Reservas próximas
    - GET    /api/bookings/past/            -> Reservas pasadas
    - GET    /api/bookings/stats/           -> Estadísticas (admin)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]
