import logging
from datetime import datetime, timezone

from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

security_logger = logging.getLogger('security')


def _get_client_ip(request):
    if request is None:
        return ''
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _user_agent(request):
    if request is None:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')


@receiver(user_logged_in)
def log_login_success(sender, request, user, **kwargs):
    security_logger.warning(
        'auth.login.success',
        extra={
            'event': {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'ip': _get_client_ip(request),
                'user_agent': _user_agent(request),
                'user': getattr(user, 'email', ''),
            }
        },
    )


@receiver(user_login_failed)
def log_login_failed(sender, credentials, request, **kwargs):
    security_logger.warning(
        'auth.login.failed',
        extra={
            'event': {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'ip': _get_client_ip(request),
                'user_agent': _user_agent(request),
                'username': (credentials or {}).get('username') or (credentials or {}).get('email', ''),
            }
        },
    )


@receiver(user_logged_out)
def log_logout(sender, request, user, **kwargs):
    security_logger.warning(
        'auth.logout',
        extra={
            'event': {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'ip': _get_client_ip(request),
                'user_agent': _user_agent(request),
                'user': getattr(user, 'email', ''),
            }
        },
    )
