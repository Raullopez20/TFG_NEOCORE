"""
Configuración de URLs para la app de disponibilidad (availability).

Registra tres ViewSets que gestionan distintos aspectos de la disponibilidad:
    - GET/POST   /api/availability/rules/             -> Reglas de disponibilidad semanal
    - GET/PUT/DEL /api/availability/rules/{id}/       -> Detalle de una regla
    - GET/POST   /api/availability/time-off/          -> Períodos de ausencia
    - GET/PUT/DEL /api/availability/time-off/{id}/    -> Detalle de una ausencia
    - GET        /api/availability/slots/get_slots/   -> Slots disponibles (público)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AvailabilityRuleViewSet,
    TimeOffViewSet,
    AvailabilitySlotViewSet,
)

router = DefaultRouter()
router.register(r'availability/rules', AvailabilityRuleViewSet, basename='availability-rule')
router.register(r'availability/time-off', TimeOffViewSet, basename='time-off')
router.register(r'availability/slots', AvailabilitySlotViewSet, basename='availability-slot')

urlpatterns = [
    path('', include(router.urls)),
]
