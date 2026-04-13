from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ContactMessageView, NotificationLogViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationLogViewSet, basename='notification')

urlpatterns = [
    path('contact/', ContactMessageView.as_view(), name='contact-message'),
    path('', include(router.urls)),
]
