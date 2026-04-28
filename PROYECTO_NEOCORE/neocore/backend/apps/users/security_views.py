import logging
from datetime import datetime, timezone

from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView
from django.contrib.auth import logout
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit

security_logger = logging.getLogger('security')


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _blocked_response(message):
    return JsonResponse({'detail': message}, status=429)


@method_decorator(ratelimit(key='ip', rate='20/15m', method='POST', block=False), name='dispatch')
class SecureLoginView(LoginView):
    """Login con rate limit por IP y logging de bloqueos."""

    def dispatch(self, request, *args, **kwargs):
        if getattr(request, 'limited', False):
            security_logger.warning(
                'ratelimit.login.blocked',
                extra={
                    'event': {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'ip': _get_client_ip(request),
                        'path': request.path,
                        'method': request.method,
                    }
                },
            )
            return _blocked_response('Demasiados intentos de inicio de sesion. Espera 15 minutos e intentalo de nuevo.')
        return super().dispatch(request, *args, **kwargs)


@method_decorator(ratelimit(key='ip', rate='10/h', method='POST', block=False), name='dispatch')
class SecureRegisterView(RegisterView):
    """Registro con rate limit por IP."""

    def dispatch(self, request, *args, **kwargs):
        if getattr(request, 'limited', False):
            security_logger.warning(
                'ratelimit.register.blocked',
                extra={
                    'event': {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'ip': _get_client_ip(request),
                        'path': request.path,
                        'method': request.method,
                    }
                },
            )
            return _blocked_response('Has superado el limite de registros. Intenta de nuevo en una hora.')
        return super().dispatch(request, *args, **kwargs)


class SecureLogoutView(LogoutView):
    """Logout que invalida totalmente la sesion en servidor."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        logout(request)
        request.session.flush()
        return response
