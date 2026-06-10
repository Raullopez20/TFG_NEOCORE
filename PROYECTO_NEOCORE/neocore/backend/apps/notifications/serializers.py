import re

from bleach import clean
from django.core.validators import EmailValidator
from rest_framework import serializers

SPANISH_NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,120}$")


class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField(validators=[EmailValidator()])
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=180)
    message = serializers.CharField(max_length=2000)

    def validate_phone(self, value):
        value = value.strip()
        if value and not re.match(r"^[0-9+\s().-]{6,30}$", value):
            raise serializers.ValidationError('El teléfono contiene caracteres no permitidos.')
        return clean(value, tags=[], attributes={}, strip=True)

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
