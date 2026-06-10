import logging
from datetime import datetime, timezone

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import ContactMessageSerializer

security_logger = logging.getLogger('security')


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


class ContactThrottle(AnonRateThrottle):
    scope = 'contact'


class ContactMessageView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ContactThrottle]

    def post(self, request, *args, **kwargs):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        html_message = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px">
          <div style="background:#1d4ed8;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">NeoCore — Nuevo mensaje de contacto</h1>
          </div>
          <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:120px">Nombre</td><td style="padding:8px 0;font-weight:600">{data['name']}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px">Email</td><td style="padding:8px 0"><a href="mailto:{data['email']}" style="color:#1d4ed8">{data['email']}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px">Teléfono</td><td style="padding:8px 0">{data.get('phone') or '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px">Asunto</td><td style="padding:8px 0;font-weight:600">{data['subject']}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#64748b;font-size:14px;margin:0 0 8px">Mensaje:</p>
            <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:15px;line-height:1.6;color:#1e293b">{data['message']}</div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#94a3b8;font-size:12px;margin:0">Enviado desde <a href="https://neocoree.xyz" style="color:#1d4ed8">neocoree.xyz</a></p>
          </div>
        </div>
        """

        plain_message = (
            f"Nuevo mensaje de contacto NeoCore\n\n"
            f"Nombre: {data['name']}\n"
            f"Email: {data['email']}\n"
            f"Teléfono: {data.get('phone') or '—'}\n"
            f"Asunto: {data['subject']}\n\n"
            f"Mensaje:\n{data['message']}"
        )

        try:
            send_mail(
                subject=f"[Contacto NeoCore] {data['subject']}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONTACT_RECIPIENT_EMAIL],
                fail_silently=False,
                html_message=html_message,
            )
            security_logger.info('contact.sent', extra={'event': {'ip': _get_client_ip(request), 'email': data['email']}})
        except Exception as exc:
            security_logger.error('contact.email_failed: %s', exc)
            # No exponemos el error al usuario — la configuración SMTP se añade en Vercel

        # Email de confirmación al remitente (independiente del email interno)
        confirmation_html = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px">
          <div style="background:#1d4ed8;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">NeoCore — Hemos recibido tu mensaje</h1>
          </div>
          <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <p style="font-size:15px;line-height:1.6;color:#1e293b">Hola {data['name']},</p>
            <p style="font-size:15px;line-height:1.6;color:#1e293b">
              Gracias por contactar con <strong>NeoCore</strong>. Hemos recibido tu mensaje
              con el asunto <strong>«{data['subject']}»</strong> y nuestro equipo te responderá
              en menos de 24 horas laborables.
            </p>
            <p style="color:#64748b;font-size:14px;margin:20px 0 8px">Copia de tu mensaje:</p>
            <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:14px;line-height:1.6;color:#475569">{data['message']}</div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#94a3b8;font-size:12px;margin:0">
              NeoCore · Calle de la Salud, 28 · 28013 Madrid · +34 910 555 730<br/>
              Este es un mensaje automático, no respondas a este correo.
            </p>
          </div>
        </div>
        """
        confirmation_plain = (
            f"Hola {data['name']},\n\n"
            f"Gracias por contactar con NeoCore. Hemos recibido tu mensaje con el asunto "
            f"\"{data['subject']}\" y nuestro equipo te responderá en menos de 24 horas laborables.\n\n"
            f"Copia de tu mensaje:\n{data['message']}\n\n"
            f"NeoCore · Calle de la Salud, 28 · 28013 Madrid · +34 910 555 730"
        )
        try:
            send_mail(
                subject='NeoCore — Hemos recibido tu mensaje',
                message=confirmation_plain,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[data['email']],
                fail_silently=False,
                html_message=confirmation_html,
            )
        except Exception as exc:
            security_logger.error('contact.confirmation_email_failed: %s', exc)

        return Response({'detail': 'Mensaje enviado correctamente. Nos pondremos en contacto pronto.'}, status=status.HTTP_201_CREATED)
