import logging
from datetime import datetime, timezone

from django.conf import settings
from django.core.mail import send_mail
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ContactMessageSerializer

security_logger = logging.getLogger('security')


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


@method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=False), name='dispatch')
class ContactMessageView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        if getattr(request, 'limited', False):
            security_logger.warning(
                'ratelimit.contact.blocked',
                extra={
                    'event': {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'ip': _get_client_ip(request),
                        'path': request.path,
                        'method': request.method,
                    }
                },
            )
            return Response(
                {'detail': 'Has superado el limite de envios del formulario. Intenta de nuevo en una hora.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        message = (
            f"Nuevo mensaje de contacto NeoCore\n\n"
            f"Nombre: {data['name']}\n"
            f"Email: {data['email']}\n"
            f"Asunto: {data['subject']}\n\n"
            f"Mensaje:\n{data['message']}"
        )

        send_mail(
            subject=f"[Contacto NeoCore] {data['subject']}",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_RECIPIENT_EMAIL],
            fail_silently=False,
        )

        return Response({'detail': 'Mensaje enviado correctamente.'}, status=status.HTTP_201_CREATED)
