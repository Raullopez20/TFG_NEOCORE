"""
URL configuration for availability app.
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
