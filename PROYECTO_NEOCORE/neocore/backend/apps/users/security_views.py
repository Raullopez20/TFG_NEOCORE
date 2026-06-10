import logging
from datetime import datetime, timezone

from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.serializers import PasswordResetSerializer
from dj_rest_auth.views import LoginView, LogoutView, PasswordResetView
from django.conf import settings
from django.contrib.auth import logout
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

security_logger = logging.getLogger('security')


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _frontend_reset_url(request, user, temp_key):
    """Generate a password-reset link pointing to the Next.js frontend."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    base = getattr(settings, 'FRONTEND_URL', 'https://neocoree.xyz').rstrip('/')
    return f'{base}/es/reset-password/{uid}/{temp_key}/'


class FrontendPasswordResetSerializer(PasswordResetSerializer):
    """Genera el enlace hacia Next.js y usa la plantilla HTML personalizada."""

    def get_email_options(self):
        return {
            'url_generator': _frontend_reset_url,
            'html_email_template_name': 'account/email/password_reset_key.html',
            'subject_template_name': 'account/email/password_reset_key_subject.txt',
            'email_template_name': 'account/email/password_reset_key_message.txt',
        }


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'


class SecureLoginView(LoginView):
    """Login with DRF-native rate limiting and security logging."""

    throttle_classes = [LoginRateThrottle]

    def throttled(self, request, wait):
        security_logger.warning(
            'ratelimit.login.blocked',
            extra={
                'event': {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'ip': _get_client_ip(request),
                    'path': request.path,
                    'method': request.method,
                    'wait_seconds': wait,
                }
            },
        )
        raise Throttled(wait, detail='Demasiados intentos de inicio de sesion. Espera un momento e intentalo de nuevo.')


class SecureRegisterView(RegisterView):
    """Registration with DRF-native rate limiting."""

    throttle_classes = [RegisterRateThrottle]


class SecurePasswordResetView(PasswordResetView):
    """Password reset — CSRF-exempt and graceful on email failure."""

    # Empty authentication_classes removes SessionAuthentication, which is the
    # source of CSRF enforcement when the browser carries a session cookie.
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = FrontendPasswordResetSerializer

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception:
            # SMTP not configured or other email failure — return 200 anyway.
            # Never confirm whether the address exists in the system.
            pass
        return Response(
            {'detail': 'Si el correo existe, recibirás las instrucciones en breve.'},
            status=status.HTTP_200_OK,
        )


class SecureLogoutView(LogoutView):
    """Logout that fully invalidates the server-side session."""

    def post(self, request, *args, **kwargs):
        try:
            super().post(request, *args, **kwargs)
        except Exception:
            pass
        logout(request)
        request.session.flush()
        # Always 200 — server-side session is cleared regardless of token blacklisting.
        return Response({'detail': 'Sesión cerrada correctamente.'}, status=status.HTTP_200_OK)
