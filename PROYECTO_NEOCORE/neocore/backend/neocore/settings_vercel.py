"""
Configuracion Django para ejecucion serverless en Vercel.

Se apoya en ``neocore.settings`` pero sobreescribe todo lo que no
funciona bien (o directamente no funciona) en entorno serverless:

    - Celery / Redis: no hay proceso worker persistente en Vercel.
    - django-axes: necesita escrituras frecuentes y estado entre requests.
    - allauth social: innecesario para el TFG y anade peso al bundle.
    - admin_honeypot: no aporta en serverless (sin dominio /admin/ publico).
    - Archivos multimedia subidos: el sistema de ficheros es efimero.

La idea es mantener la API REST (auth JWT, users, services, bookings,
availability, reviews, contact) funcionando con la misma base de codigo,
usando Neon PostgreSQL via ``DATABASE_URL``.
"""

from .settings import *  # noqa: F401, F403
from .settings import (  # noqa: F401
    INSTALLED_APPS,
    MIDDLEWARE,
    AUTHENTICATION_BACKENDS,
    REST_FRAMEWORK,
    env,
)

# ============================================================================
# MODO SERVERLESS
# ============================================================================
DEBUG = env.bool("DEBUG", default=False)

# En Vercel el backend esta detras del propio dominio (mismo origen via
# rewrite) o de un dominio ad-hoc *.vercel.app. Aceptamos todos porque
# la validacion de Host ya la hace Vercel.
ALLOWED_HOSTS = ["*"]

# Confiamos en los origenes donde se sirve el frontend.
CSRF_TRUSTED_ORIGINS = [
    "https://neocoree.xyz",
    "https://www.neocoree.xyz",
    "https://*.vercel.app",
]

CORS_ALLOWED_ORIGINS = [
    "https://neocoree.xyz",
    "https://www.neocoree.xyz",
    "https://api.neocoree.xyz",  # Allow API subdomain requests
]
CORS_ALLOW_CREDENTIALS = True

# ============================================================================
# APPS: quitar las que no son serverless-friendly
# ============================================================================
_REMOVED_APPS = {
    "axes",
    "admin_honeypot",
    "django_celery_beat",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
}
INSTALLED_APPS = [a for a in INSTALLED_APPS if a not in _REMOVED_APPS]

# ============================================================================
# MIDDLEWARE: quitar axes y middlewares que asumen infra persistente
# ============================================================================
_REMOVED_MIDDLEWARE = {
    "axes.middleware.AxesMiddleware",
    "neocore.middleware.AdminIPRestrictionMiddleware",
}
MIDDLEWARE = [m for m in MIDDLEWARE if m not in _REMOVED_MIDDLEWARE]

# ============================================================================
# AUTHENTICATION BACKENDS: fuera axes
# ============================================================================
AUTHENTICATION_BACKENDS = [
    b for b in AUTHENTICATION_BACKENDS if "axes" not in b
]

# ============================================================================
# CACHE: in-memory (por request, sin estado compartido)
# ============================================================================
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "neocore-vercel",
    }
}

# ============================================================================
# CELERY: deshabilitado. Enviamos mails sincronos.
# ============================================================================
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ============================================================================
# EMAIL: en serverless, usar SMTP directo via env vars.
# Si no hay SMTP configurado, los emails van a console (stdout de Vercel).
# ============================================================================
if env("EMAIL_HOST", default=""):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ============================================================================
# STATIC FILES: Whitenoise ya esta configurado en settings base.
# En serverless no servimos media uploaded (system efimero).
# ============================================================================
# STATIC_ROOT ya viene de settings.py. Whitenoise middleware tambien.

# ============================================================================
# RATELIMIT: desactivado (django-ratelimit necesita cache persistente).
# ============================================================================
RATELIMIT_ENABLE = False

# ============================================================================
# REST FRAMEWORK: sin throttling basado en cache
# ============================================================================
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {},
}

# ============================================================================
# SEGURIDAD HTTPS: Vercel termina SSL, confiamos en su header.
# ============================================================================
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
