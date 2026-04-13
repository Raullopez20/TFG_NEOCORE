import re

from bleach import clean
from django.core.validators import EmailValidator
from rest_framework import serializers

from .models import NotificationLog

SPANISH_NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,120}$")


class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField(validators=[EmailValidator()])
    subject = serializers.CharField(max_length=180)
    message = serializers.CharField(max_length=2000)

    def validate_name(self, value):
        value = value.strip()
        if not SPANISH_NAME_RE.match(value):
            raise serializers.ValidationError('El nombre contiene caracteres no permitidos.')
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_subject(self, value):
        value = value.strip()
        return clean(value, tags=[], attributes={}, strip=True)

    def validate_message(self, value):
        value = value.strip()
        return clean(value, tags=[], attributes={}, strip=True)


class NotificationLogSerializer(serializers.ModelSerializer):
    """
    Serializador de solo lectura para el historial de notificaciones.

    Expone el registro de todas las notificaciones enviadas por el sistema.
    Los usuarios solo ven sus propias notificaciones; los administradores
    pueden ver todas.
    """

    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)

    class Meta:
        model = NotificationLog
        fields = [
            'id',
            'recipient',
            'recipient_email',
            'booking',
            'notification_type',
            'status',
            'subject',
            'message',
            'sent_at',
            'error_message',
            'created_at',
        ]
        read_only_fields = fields
