import logging
import re
from datetime import datetime, timezone

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

security_logger = logging.getLogger('security')


class TrailingSlashMiddleware(MiddlewareMixin):
    """
    Vercel CDN strips trailing slashes (308) before rewrites reach Django.
    This middleware re-adds the slash internally so Django URL patterns match,
    without issuing another HTTP redirect (which would loop with APPEND_SLASH=True).
    """

    def process_request(self, request):
        path = request.path
        # Only touch paths without extension and without trailing slash
        last_segment = path.split('/')[-1]
        if path != '/' and not path.endswith('/') and '.' not in last_segment:
            request.path_info = path + '/'
            request.META['PATH_INFO'] = path + '/'
        return None


class SecurityAnalysisMiddleware(MiddlewareMixin):
    """Analiza cada peticion y bloquea comportamiento anomalo o malicioso."""

    MALICIOUS_UA_PATTERNS = [
        re.compile(r"sqlmap", re.IGNORECASE),
        re.compile(r"nikto", re.IGNORECASE),
        re.compile(r"nmap", re.IGNORECASE),
        re.compile(r"acunetix", re.IGNORECASE),
        re.compile(r"wpscan", re.IGNORECASE),
        re.compile(r"masscan", re.IGNORECASE),
        re.compile(r"zgrab", re.IGNORECASE),
    ]

    SENSITIVE_PATH_PATTERNS = [
        re.compile(r"^/admin/?$", re.IGNORECASE),
        re.compile(r"^/\.env", re.IGNORECASE),
        re.compile(r"^/wp-admin", re.IGNORECASE),
    ]

    SUSPICIOUS_HEADER_PATTERNS = [
        re.compile(r"<script", re.IGNORECASE),
        re.compile(r"javascript:", re.IGNORECASE),
        re.compile(r"union\s+select", re.IGNORECASE),
        re.compile(r";\s*(drop|truncate)\s+table", re.IGNORECASE),
        re.compile(r"xp_cmdshell", re.IGNORECASE),
    ]

    def _get_client_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def _security_response(self, message, status_code):
        return JsonResponse({'detail': message}, status=status_code)

    def _log_event(self, level, message, **extra):
        payload = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            **extra,
        }
        if level == 'warning':
            security_logger.warning(message, extra={'event': payload})
        else:
            security_logger.info(message, extra={'event': payload})

    def process_request(self, request):
        ip = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        username = None
        if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
            username = request.user.email

        self._log_event(
            'info',
            'request.received',
            ip=ip,
            method=request.method,
            path=request.path,
            user_agent=user_agent,
            user=username,
        )

        if ip:
            ip_blacklist_key = f'security:blacklist:{ip}'
            if cache.get(ip_blacklist_key):
                self._log_event(
                    'warning',
                    'request.blocked.blacklisted_ip',
                    ip=ip,
                    path=request.path,
                    method=request.method,
                )
                return self._security_response('Tu IP esta temporalmente bloqueada por actividad sospechosa.', 403)

            ip_req_key = f'security:req_hour:{ip}'
            total_req = cache.get(ip_req_key, 0)
            if total_req >= 1000:
                cache.set(ip_blacklist_key, True, timeout=3600)
                self._log_event(
                    'warning',
                    'request.blocked.anomalous_rate',
                    ip=ip,
                    path=request.path,
                    method=request.method,
                    requests_last_hour=total_req,
                )
                return self._security_response('Actividad anomala detectada. Intenta de nuevo mas tarde.', 429)
            cache.set(ip_req_key, total_req + 1, timeout=3600)

        if ip and request.path.startswith('/api/'):
            api_key = f'security:api_hour:{ip}'
            api_req = cache.get(api_key, 0)
            if api_req >= 500:
                self._log_event(
                    'warning',
                    'request.blocked.api_rate_limit',
                    ip=ip,
                    path=request.path,
                    method=request.method,
                    api_requests_last_hour=api_req,
                )
                return self._security_response('Has superado el limite de 100 peticiones por hora para la API.', 429)
            cache.set(api_key, api_req + 1, timeout=3600)

        for ua_pattern in self.MALICIOUS_UA_PATTERNS:
            if ua_pattern.search(user_agent):
                if ip:
                    cache.set(f'security:blacklist:{ip}', True, timeout=24 * 3600)
                self._log_event(
                    'warning',
                    'request.blocked.malicious_user_agent',
                    ip=ip,
                    user_agent=user_agent,
                    path=request.path,
                )
                return self._security_response('User-Agent bloqueado por seguridad.', 403)

        for path_pattern in self.SENSITIVE_PATH_PATTERNS:
            if path_pattern.search(request.path):
                self._log_event(
                    'warning',
                    'request.sensitive_path_probe',
                    ip=ip,
                    path=request.path,
                    method=request.method,
                )

        header_blob = ' '.join([str(v) for v in request.headers.values()])
        for pattern in self.SUSPICIOUS_HEADER_PATTERNS:
            if pattern.search(header_blob):
                self._log_event(
                    'warning',
                    'request.suspicious_headers',
                    ip=ip,
                    path=request.path,
                    method=request.method,
                )
                return self._security_response('Cabeceras sospechosas detectadas.', 400)

        if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
            activity_key = f'security:last_activity_update:{request.user.pk}'
            if not cache.get(activity_key):
                request.user.save(update_fields=['last_activity_at'])
                cache.set(activity_key, True, timeout=3600)

        return None


class SQLInjectionProtectionMiddleware(MiddlewareMixin):
    """Bloquea patrones tipicos de SQL injection en query params y body."""

    SQLI_PATTERN = re.compile(
        r"union\s+select"
        r"|;\s*(drop|truncate|insert|update|delete)\s+\w"
        r"|xp_cmdshell"
        r"|\bor\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d"
        r"|\band\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d",
        re.IGNORECASE,
    )

    def _get_client_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def process_request(self, request):
        ip = self._get_client_ip(request)
        query_string = request.META.get('QUERY_STRING', '')

        if self.SQLI_PATTERN.search(query_string):
            security_logger.warning(
                'request.blocked.sqli.query_params',
                extra={
                    'event': {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'ip': ip,
                        'path': request.path,
                        'method': request.method,
                        'query_string': query_string,
                    }
                },
            )
            return JsonResponse({'detail': 'Patron de inyeccion SQL detectado.'}, status=400)

        if not request.body:
            return None

        body_text = request.body[:4096].decode('utf-8', errors='ignore')
        if self.SQLI_PATTERN.search(body_text):
            security_logger.warning(
                'request.blocked.sqli.body',
                extra={
                    'event': {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'ip': ip,
                        'path': request.path,
                        'method': request.method,
                    }
                },
            )
            return JsonResponse({'detail': 'Patron de inyeccion SQL detectado.'}, status=400)

        return None


class SafeAllauthMiddleware(MiddlewareMixin):
    """
    Wraps allauth's AccountMiddleware so that database errors during cold start
    (e.g. tables not yet migrated) don't cause 500s on every request.
    """

    def __init__(self, get_response=None):
        try:
            from allauth.account.middleware import AccountMiddleware
            self._inner = AccountMiddleware(get_response)
        except Exception:
            self._inner = None
        super().__init__(get_response)

    def process_request(self, request):
        if self._inner is None:
            return None
        try:
            return self._inner.process_request(request)
        except Exception:
            return None

    def process_response(self, request, response):
        if self._inner is None:
            return response
        try:
            return self._inner.process_response(request, response)
        except Exception:
            return response


class AdminIPRestrictionMiddleware(MiddlewareMixin):
    """Restringe el admin real a una lista blanca de IPs."""

    def _get_client_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def process_request(self, request):
        admin_path = f"/{settings.ADMIN_PATH.strip('/')}"
        if not request.path.startswith(admin_path):
            return None

        allowed_ips = set(settings.ADMIN_ALLOWED_IPS or [])
        if not allowed_ips:
            return None

        ip = self._get_client_ip(request)
        if ip in allowed_ips:
            return None

        security_logger.warning(
            'request.blocked.admin_ip',
            extra={
                'event': {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'ip': ip,
                    'path': request.path,
                    'method': request.method,
                }
            },
        )
        return JsonResponse({'detail': 'Acceso al panel de administracion no permitido desde esta IP.'}, status=403)
