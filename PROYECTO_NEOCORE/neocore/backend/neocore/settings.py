"""
Configuración principal del proyecto Django NeoCore.

Este archivo centraliza toda la configuración del proyecto, incluyendo:
    - Seguridad (SECRET_KEY, ALLOWED_HOSTS, CSRF, CORS)
    - Base de datos (PostgreSQL)
    - Autenticación (JWT con SimpleJWT, django-allauth, dj-rest-auth)
    - Internacionalización (español/inglés)
    - Archivos estáticos y multimedia (WhiteNoise)
    - REST Framework (paginación, filtros, throttling)
    - Celery y Redis (tareas asíncronas y caché)
    - Configuración de correo electrónico

Las variables sensibles se cargan desde un archivo .env mediante
la librería django-environ para mantener la seguridad.
"""

import os
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlparse

import environ

# ============================================================================
# RUTAS BASE DEL PROYECTO
# ============================================================================
# BASE_DIR apunta al directorio 'backend/', donde se encuentra manage.py
BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================================
# VARIABLES DE ENTORNO
# ============================================================================
# Se inicializa django-environ con valores por defecto seguros.
# DEBUG=False por defecto para evitar exposición accidental en producción.
env = environ.Env(
    DEBUG=(bool, False)
)

# Se lee el archivo .env desde el directorio padre del backend (raíz del proyecto)
environ.Env.read_env(os.path.join(BASE_DIR.parent, '.env'))

# ============================================================================
# SEGURIDAD
# ============================================================================
# Clave secreta utilizada para firmas criptográficas (tokens, sesiones, etc.)
# IMPORTANTE: Debe ser única y secreta en producción
SECRET_KEY = env(
    'SECRET_KEY',
    default='neocore-dev-key-CHANGE-THIS-IN-PRODUCTION-never-use-in-prod-x9k2p7q3r5',
)

def _derive_fernet_key(secret: str) -> str:
    """Derive a valid 32-byte Fernet key from SECRET_KEY via SHA-256."""
    import hashlib
    import base64
    raw = hashlib.sha256(secret.encode()).digest()  # always 32 bytes
    return base64.urlsafe_b64encode(raw).decode()

# FIELD_ENCRYPTION_KEY must be a valid Fernet key.
# If not explicitly set, derive one deterministically from SECRET_KEY.
# In production, set FIELD_ENCRYPTION_KEY explicitly with:
#   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FIELD_ENCRYPTION_KEY = env('FIELD_ENCRYPTION_KEY', default=_derive_fernet_key(SECRET_KEY))

# Modo depuración: muestra errores detallados y desactiva ciertas protecciones.
# NUNCA activar en producción.
DEBUG = env.bool('DEBUG', default=False)

# Lista de hosts/dominios permitidos para servir la aplicación.
# Protege contra ataques de tipo HTTP Host header.
def _extract_host(value: str) -> str:
    """Extrae el host (sin esquema ni puerto) desde una URL/host."""
    candidate = (value or '').strip()
    if not candidate:
        return ''
    if '://' in candidate:
        parsed = urlparse(candidate)
        return (parsed.hostname or '').strip()
    return candidate.split(':', 1)[0].strip()


def _build_allowed_hosts() -> list[str]:
    defaults = [
        'neocoree.xyz',
        'www.neocoree.xyz',
        'api.neocoree.xyz',
    ]

    if DEBUG:
        defaults = [
            'localhost',
            '127.0.0.1',
            'web',
            *defaults,
        ]

    configured = env.list('ALLOWED_HOSTS', default=[])
    inferred = [
        env('BACKEND_PUBLIC_URL', default=''),
        env('NEXT_PUBLIC_DOMAIN', default=''),
        env('VERCEL_URL', default=''),
        env('VERCEL_BRANCH_URL', default=''),
        env('VERCEL_PROJECT_PRODUCTION_URL', default=''),
    ]

    hosts: list[str] = []
    for item in [*defaults, *configured, *inferred]:
        host = _extract_host(item)
        if host and host not in hosts:
            hosts.append(host)

    # On Vercel, add the wildcard .vercel.app for preview deployments.
    # Vercel terminates TLS at the edge so we also need localhost for internal health checks.
    vercel_env = env('VERCEL_ENV', default='')
    if vercel_env:
        for h in ['localhost', '127.0.0.1', '.vercel.app']:
            if h not in hosts:
                hosts.append(h)

    return hosts


ALLOWED_HOSTS = _build_allowed_hosts()

# ============================================================================
# APLICACIONES INSTALADAS
# ============================================================================
# Se organizan en tres bloques:
#   1. Apps nativas de Django (admin, auth, etc.)
#   2. Librerías/apps de terceros (DRF, CORS, allauth, etc.)
#   3. Apps propias del proyecto NeoCore (users, services, bookings, etc.)
INSTALLED_APPS = [
    # --- Apps nativas de Django ---
    'django.contrib.admin',          # Panel de administración
    'django.contrib.auth',           # Sistema de autenticación
    'django.contrib.contenttypes',   # Framework de tipos de contenido
    'django.contrib.sessions',       # Gestión de sesiones
    'django.contrib.messages',       # Framework de mensajes
    'django.contrib.staticfiles',    # Gestión de archivos estáticos
    'django.contrib.sites',          # Framework de sitios (requerido por allauth)
    'django.contrib.humanize',
    
    # --- Apps de terceros ---
    'rest_framework',                          # Django REST Framework para la API REST
    'rest_framework.authtoken',                # Autenticación basada en tokens
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',                             # Manejo de CORS (Cross-Origin Resource Sharing)
    'django_filters',                          # Filtros avanzados para las vistas de la API
    'drf_spectacular',                         # Generación automática de documentación OpenAPI/Swagger
    'csp',
    'axes',
    'django_bleach',
    'admin_honeypot',
    'allauth',                                 # Autenticación social y gestión de cuentas
    'allauth.account',                         # Gestión de cuentas de usuario (email, contraseña)
    'allauth.socialaccount',                   # Autenticación mediante proveedores sociales
    'allauth.socialaccount.providers.google',  # Proveedor de autenticación con Google
    'dj_rest_auth',                            # Endpoints REST para autenticación
    'dj_rest_auth.registration',               # Endpoints REST para registro de usuarios
    'djoser',                                  # Endpoints REST de usuarios y JWT para intermodular
    'django_celery_beat',                      # Programador de tareas periódicas con Celery

    # --- Apps propias del proyecto ---
    'apps.users',          # Gestión de usuarios (clientes, profesionales, administradores)
    'apps.services',       # Catálogo de servicios ofrecidos por el centro
    'apps.bookings',       # Sistema de reservas y citas
    'apps.availability',   # Disponibilidad horaria de los profesionales
    'apps.notifications',  # Sistema de notificaciones por email
]

# ============================================================================
# MIDDLEWARE
# ============================================================================
# Cadena de middlewares que procesan cada petición/respuesta HTTP.
# El orden es importante: se ejecutan de arriba a abajo en la petición
# y de abajo a arriba en la respuesta.
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',       # Cabeceras de seguridad HTTP (HSTS, etc.)
    'whitenoise.middleware.WhiteNoiseMiddleware',          # Servir archivos estáticos eficientemente
    'csp.middleware.CSPMiddleware',
    'corsheaders.middleware.CorsMiddleware',               # Gestión de cabeceras CORS
    'django.contrib.sessions.middleware.SessionMiddleware',# Manejo de sesiones de usuario
    'axes.middleware.AxesMiddleware',
    'neocore.middleware.TrailingSlashMiddleware',
    'neocore.middleware.SecurityAnalysisMiddleware',
    'neocore.middleware.SQLInjectionProtectionMiddleware',
    'neocore.middleware.AdminIPRestrictionMiddleware',
    'django.middleware.locale.LocaleMiddleware',           # Detección de idioma del usuario
    'django.middleware.common.CommonMiddleware',           # Funcionalidades HTTP comunes
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Asocia usuarios a las peticiones
    'django.contrib.messages.middleware.MessageMiddleware',    # Framework de mensajes flash
    'django.middleware.clickjacking.XFrameOptionsMiddleware', # Protección contra clickjacking
    'allauth.account.middleware.AccountMiddleware',
]

# ============================================================================
# CONFIGURACIÓN DE URLs Y PLANTILLAS
# ============================================================================
# Módulo raíz de URLs del proyecto
ROOT_URLCONF = 'neocore.urls'

# Configuración del motor de plantillas Django
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Directorio de plantillas personalizadas
        'APP_DIRS': True,                   # Buscar plantillas dentro de cada app
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Aplicación WSGI para el despliegue en producción
WSGI_APPLICATION = 'neocore.wsgi.application'

# ============================================================================
# BASE DE DATOS
# ============================================================================
# Soporta dos modos de configuración:
#   1) DATABASE_URL (recomendado en Vercel + Neon)
#   2) Variables POSTGRES_* (útil en Docker local)
# Si existe DATABASE_URL, se prioriza automáticamente.
DATABASE_URL = env('DATABASE_URL', default='')

if DATABASE_URL:
    _db_config = env.db('DATABASE_URL')
    _db_config.setdefault('CONN_MAX_AGE', 60)
    # Neon (and most managed PostgreSQL services) require SSL.
    # dj-database-url preserves OPTIONS if already set in the URL params;
    # this sets a safe default for connections that don't specify it.
    _db_config.setdefault('OPTIONS', {})
    _db_config['OPTIONS'].setdefault('sslmode', 'require')
    DATABASES = {'default': _db_config}
elif env('POSTGRES_DB', default='') and env('POSTGRES_USER', default=''):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('POSTGRES_DB'),
            'USER': env('POSTGRES_USER'),
            'PASSWORD': env('POSTGRES_PASSWORD'),
            'HOST': env('POSTGRES_HOST', default='localhost'),
            'PORT': env('POSTGRES_PORT', default='5432'),
            'CONN_MAX_AGE': 60,
            'OPTIONS': {'sslmode': 'prefer'},
        }
    }
else:
    # Local development fallback. In production, DATABASE_URL must be set.
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ============================================================================
# VALIDACIÓN DE CONTRASEÑAS
# ============================================================================
# Conjunto de validadores que aseguran la robustez de las contraseñas:
#   - No similar al nombre de usuario u otros datos personales
#   - Longitud mínima requerida
#   - No ser una contraseña común (ej: 'password123')
#   - No ser completamente numérica
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# ============================================================================
# INTERNACIONALIZACIÓN Y LOCALIZACIÓN
# ============================================================================
# Idioma por defecto de la aplicación (español)
LANGUAGE_CODE = env('LANGUAGE_CODE', default='es')

# Idiomas soportados por la aplicación
LANGUAGES = [
    ('es', 'Español'),
    ('en', 'English'),
]

# Zona horaria del servidor (España peninsular)
TIME_ZONE = env('TIME_ZONE', default='Europe/Madrid')

# Activar el sistema de internacionalización de Django (traducciones)
USE_I18N = True

# Activar el soporte de zonas horarias conscientes (aware datetimes)
USE_TZ = True

# Directorios donde Django buscará archivos de traducción (.po/.mo)
LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# ============================================================================
# ARCHIVOS ESTÁTICOS (CSS, JavaScript, Imágenes)
# ============================================================================
# URL pública para acceder a los archivos estáticos
_is_vercel = bool(env('VERCEL', default=''))

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []
# On Vercel serverless, use finders as fallback if collectstatic wasn't run.
WHITENOISE_USE_FINDERS = _is_vercel
# Avoid manifest storage on Vercel (staticfiles.json won't exist without collectstatic).
if _is_vercel:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
else:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ============================================================================
# ARCHIVOS MULTIMEDIA — Cloudinary en producción, local en desarrollo
# ============================================================================
# Si CLOUDINARY_URL está definida, todas las imágenes se guardan en Cloudinary
# (CDN gratuita 25 GB, permanente entre cold starts de Vercel).
# Sin ella, las imágenes van a /tmp/media (efímero) o media/ (local Docker).
_cloudinary_url = env('CLOUDINARY_URL', default='')

try:
    import cloudinary as _cld
    _cloudinary_pkg_ok = True
except ImportError:
    _cloudinary_pkg_ok = False

if _cloudinary_url and _cloudinary_pkg_ok:
    import cloudinary as _cloudinary
    _cloudinary.config(url=_cloudinary_url, secure=True)
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    CLOUDINARY_STORAGE = {'CLOUDINARY_URL': _cloudinary_url}
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']  # type: ignore[name-defined]
else:
    # Fallback: /tmp/media en Vercel (efímero), media/ en local
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media' if not _is_vercel else Path('/tmp/media')
    # Crear el directorio si no existe (necesario en Vercel /tmp)
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

# ============================================================================
# CONFIGURACIÓN GENERAL DEL MODELO
# ============================================================================
# Tipo de campo por defecto para las claves primarias auto-incrementales
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Modelo de usuario personalizado del proyecto (sustituye al User de Django)
AUTH_USER_MODEL = 'users.User'

# ============================================================================
# DJANGO REST FRAMEWORK (DRF)
# ============================================================================
# Configuración global de la API REST. DRF proporciona herramientas para
# construir APIs web robustas con serialización, autenticación, permisos,
# filtrado, paginación y limitación de velocidad (throttling).
REST_FRAMEWORK = {
    # In production only serve JSON — disables the browsable HTML API (no CSP
    # violations, no missing static files, no ?path= leakage from Vercel rewrites).
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] if _is_vercel else [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    # --- Autenticación ---
    # Solo JWT — SessionAuthentication se elimina globalmente porque impone
    # verificación CSRF en peticiones POST del frontend cuando el navegador
    # lleva una cookie de sesión, causando errores 403 en registro/login.
    # El panel de administración usa su propio sistema de sesión (AuthenticationMiddleware)
    # independiente de estas clases DRF, por lo que no se ve afectado.
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    # --- Permisos ---
    # Por defecto, todas las vistas requieren usuario autenticado.
    # Se puede sobreescribir por vista individual.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # --- Backends de filtrado ---
    # Filtrado por campos (DjangoFilterBackend), búsqueda textual (SearchFilter)
    # y ordenación (OrderingFilter) habilitados globalmente.
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    # --- Paginación ---
    # Paginación basada en número de página, con 20 elementos por página.
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # --- Generación de esquema OpenAPI ---
    # drf-spectacular genera automáticamente la documentación Swagger/OpenAPI.
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # --- Throttling (limitación de velocidad) ---
    # Protege la API contra abusos limitando el número de peticiones por período.
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',   # Usuarios no autenticados
        'rest_framework.throttling.UserRateThrottle'     # Usuarios autenticados
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/hour',        # Máximo 60 peticiones/hora para anónimos
        'user': '500/hour',       # Máximo 500 peticiones/hora para autenticados
        'booking': '20/hour',     # Máximo 20 reservas/hora por usuario
        'contact': '5/hour',      # Máximo 5 mensajes de contacto/hora
        'login': '5/hour',         # Máximo 5 intentos de login por hora por IP
        'register': '10/hour',    # Máximo 10 registros por hora por IP
    }
}

# ============================================================================
# SIMPLE JWT (Tokens de autenticación)
# ============================================================================
# Configuración de los tokens JWT (JSON Web Tokens) para la autenticación
# sin estado (stateless). Los tokens se envían en la cabecera Authorization.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Token corto para reducir ventana de abuso
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),    # El token de refresco expira en 7 días
    'ROTATE_REFRESH_TOKENS': True,                  # Se genera un nuevo refresh token en cada uso
    'BLACKLIST_AFTER_ROTATION': True,               # Se invalida el refresh token anterior
    'AUTH_HEADER_TYPES': ('Bearer',),               # Prefijo del token en la cabecera HTTP
}

# ============================================================================
# DJ-REST-AUTH (Endpoints de autenticación REST)
# ============================================================================
# Configuración de dj-rest-auth, que proporciona endpoints listos para
# registro, login, logout, cambio de contraseña, etc.
REST_AUTH = {
    'USE_JWT': True,                                # Usar JWT en lugar de tokens de sesión
    'JWT_AUTH_COOKIE': None,                        # Tokens en el body JSON, no en cookies
    'JWT_AUTH_REFRESH_COOKIE': None,                # Refresh token en el body JSON, no en cookie
    # dj-rest-auth 5.x sets refresh='' in the response body when JWT_AUTH_HTTPONLY=True,
    # because it expects the refresh token to be in an httponly cookie. Since we send
    # tokens in the body (no cookies), this must be False to get the refresh token back.
    'JWT_AUTH_HTTPONLY': False,
    'SESSION_LOGIN': False,                         # Desactivar login por sesión (evita problemas con CSRF)
    'USER_DETAILS_SERIALIZER': 'apps.users.serializers.UserSerializer',
    'LOGIN_SERIALIZER': 'dj_rest_auth.serializers.LoginSerializer',
    'REGISTER_SERIALIZER': 'apps.users.serializers.CustomRegisterSerializer',
}

# ============================================================================
# DJANGO ALLAUTH (Autenticación social y gestión de cuentas)
# ============================================================================
# ID del sitio requerido por django.contrib.sites (usado internamente por allauth)
SITE_ID = 1

# El campo principal de autenticación es el email (no el username)
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
# Verification disabled: on Vercel, SMTP is not configured so sending emails
# at registration would cause 500. Users work without email verification.
ACCOUNT_EMAIL_VERIFICATION = 'none'
# No se permiten emails duplicados en el sistema
ACCOUNT_UNIQUE_EMAIL = True
# Frontend base URL — used to build password-reset links that point to the
# Next.js page instead of a Django backend URL.
FRONTEND_URL = env('FRONTEND_URL', default='https://neocoree.xyz')

# Configuración del proveedor de autenticación social de Google.
# Permite a los usuarios iniciar sesión con su cuenta de Google.
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',   # Acceso al perfil público del usuario
            'email',     # Acceso al email del usuario
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',  # No se requiere acceso offline (sin refresh token de Google)
        },
        'APP': {
            'client_id': env('GOOGLE_CLIENT_ID', default=''),       # ID de cliente de Google OAuth
            'secret': env('GOOGLE_CLIENT_SECRET', default=''),       # Secreto del cliente
            'key': ''
        }
    }
}

# ============================================================================
# CORS (Cross-Origin Resource Sharing)
# ============================================================================
# CORS controla qué orígenes (dominios) pueden hacer peticiones a la API.
# Esto es necesario porque el frontend (Next.js en localhost:3000) y el
# backend (Django en localhost:8000) corren en puertos diferentes.
def _normalize_origin(url: str) -> str:
    """Normaliza una URL/origen y devuelve solo esquema+host(+puerto)."""
    value = (url or '').strip().rstrip('/')
    if not value:
        return ''
    if not value.startswith(('http://', 'https://')):
        value = f'https://{value}'
    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        return ''
    return f'{parsed.scheme}://{parsed.netloc}'


def _build_frontend_origins() -> list[str]:
    """Construye una lista de orígenes permitidos para el frontend."""
    defaults = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://neocoree.xyz',
        'https://www.neocoree.xyz',
        'https://api.neocoree.xyz',
    ]
    configured = env.list('CORS_ALLOWED_ORIGINS', default=[])
    inferred = [
        env('NEXT_PUBLIC_DOMAIN', default=''),
        env('FRONTEND_URL', default=''),
        env('VERCEL_URL', default=''),
        env('VERCEL_BRANCH_URL', default=''),
        env('VERCEL_PROJECT_PRODUCTION_URL', default=''),
    ]

    origins: list[str] = []
    for item in [*defaults, *configured, *inferred]:
        normalized = _normalize_origin(item)
        if normalized and normalized not in origins:
            origins.append(normalized)
    return origins


CORS_ALLOWED_ORIGINS = _build_frontend_origins()
# Permitir envío de cookies y credenciales en peticiones cross-origin
CORS_ALLOW_CREDENTIALS = True
# En desarrollo se permiten todos los orígenes para facilitar las pruebas
# Never allow all origins in production; only the explicit list above.
CORS_ALLOW_ALL_ORIGINS = DEBUG
# Cabeceras HTTP permitidas en las peticiones cross-origin
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
# Métodos HTTP permitidos en las peticiones cross-origin
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# ============================================================================
# CSRF (Cross-Site Request Forgery)
# ============================================================================
# Configuración de protección CSRF para prevenir ataques de falsificación
# de peticiones entre sitios.
_csrf_candidates = set(_build_frontend_origins())
for _url in [
    env('BACKEND_PUBLIC_URL', default=''),
    env('VERCEL_URL', default=''),
    env('VERCEL_BRANCH_URL', default=''),
    env('VERCEL_PROJECT_PRODUCTION_URL', default=''),
    'https://api.neocoree.xyz',
    'https://*.vercel.app',
]:
    _norm = _normalize_origin(_url)
    if _norm:
        _csrf_candidates.add(_norm)
_csrf_candidates.discard('')
CSRF_TRUSTED_ORIGINS = list(_csrf_candidates)
CSRF_COOKIE_HTTPONLY = True       # Proteger cookie CSRF frente a acceso JS
CSRF_USE_SESSIONS = False         # Almacenar el token CSRF en cookie, no en sesión
CSRF_COOKIE_SAMESITE = 'Lax'     # Política SameSite para la cookie CSRF
CSRF_COOKIE_SECURE = not DEBUG

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 3600

# Vercel terminates TLS at the edge — never redirect HTTP→HTTPS inside Django.
# SECURE_SSL_REDIRECT=True causes infinite redirect loops on Vercel serverless.
_is_cloud_proxy = bool(
    env('VERCEL', default='') or env('VERCEL_ENV', default='')
)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False  # Always False: Vercel handles HTTPS at the CDN layer
APPEND_SLASH = False  # TrailingSlashMiddleware handles this internally without HTTP redirect
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
REFERRER_POLICY = 'strict-origin-when-cross-origin'

# ============================================================================
# CORREO ELECTRÓNICO
# ============================================================================
# Resend HTTP API (anymail) — no usa SMTP ni puertos que Vercel pueda bloquear.
# Usa HTTPS directamente a api.resend.com. Gratuito: 100 emails/día.
_resend_api_key = env('RESEND_API_KEY', default='')

try:
    import anymail  # noqa: F401
    _anymail_available = True
except ImportError:
    _anymail_available = False

if _resend_api_key and _anymail_available:
    EMAIL_BACKEND = 'anymail.backends.resend.EmailBackend'
    ANYMAIL = {'RESEND_API_KEY': _resend_api_key}
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='NeoCore <onboarding@resend.dev>')
    INSTALLED_APPS += ['anymail']  # type: ignore[name-defined]
else:
    # Fallback: consola local (o SMTP si se configuran las variables)
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='NeoCore <noreply@neocoree.xyz>')

CONTACT_RECIPIENT_EMAIL = env('CONTACT_RECIPIENT_EMAIL', default='raullopez20r@gmail.com')

# ============================================================================
# CELERY (Tareas asíncronas)
# ============================================================================
# Celery utiliza Redis como broker de mensajes y como backend de resultados.
# Permite ejecutar tareas en segundo plano como el envío de emails y recordatorios.
_redis_url = env('REDIS_URL', default='')
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default=_redis_url or 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default=_redis_url or 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']        # Solo acepta contenido JSON (seguridad)
CELERY_TASK_SERIALIZER = 'json'         # Serialización de tareas en JSON
CELERY_RESULT_SERIALIZER = 'json'       # Serialización de resultados en JSON
CELERY_TIMEZONE = TIME_ZONE             # Misma zona horaria que Django
# Usar el scheduler de base de datos para Celery Beat (tareas periódicas)
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# ============================================================================
# CACHÉ (Redis)
# ============================================================================
# Se utiliza Redis como backend de caché para mejorar el rendimiento
# almacenando datos frecuentemente consultados en memoria.
if _redis_url:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': _redis_url,
            'TIMEOUT': 300,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {'max_connections': 50},
                'IGNORE_EXCEPTIONS': True,
            }
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'neocore-default',
        }
    }

ADMIN_PATH = env('ADMIN_PATH', default='panel-administracion/')
ADMIN_ALLOWED_IPS = env.list('ADMIN_ALLOWED_IPS', default=[])

AXES_ENABLED = True
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_PARAMETERS = [["username", "ip_address"]]
AXES_VERBOSE = True

BLEACH_ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'p', 'ul', 'ol', 'li', 'br']
BLEACH_ALLOWED_ATTRIBUTES = {}
BLEACH_ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']
BLEACH_STRIP_COMMENTS = True

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com')
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://unpkg.com')
CSP_IMG_SRC = ("'self'", 'data:', 'https://images.unsplash.com', 'https://*.vercel.app',
               'https://cdn.jsdelivr.net', 'https://res.cloudinary.com')
CSP_FONT_SRC = ("'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com')
CSP_CONNECT_SRC = ("'self'", 'https://*.neon.tech', 'https://*.vercel.app',
                   'https://cdn.jsdelivr.net', 'https://unpkg.com')
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_UPGRADE_INSECURE_REQUESTS = not DEBUG

# Spectacular (API Documentation)
SPECTACULAR_SETTINGS = {
    'TITLE': 'NeoCore API',
    'DESCRIPTION': (
        'Sistema integral de reservas para centro de salud y bienestar.\n\n'
        '## Autenticación\n'
        'La mayoría de endpoints requieren un **Bearer token JWT**.\n'
        '1. Llama a `POST /api/auth/login/` con tu email y contraseña.\n'
        '2. Copia el valor de `access` de la respuesta.\n'
        '3. Pulsa **Authorize** (arriba a la derecha), pega el token y confirma.\n\n'
        '## Roles\n'
        '- **CLIENT**: puede crear y gestionar sus propias reservas.\n'
        '- **PROFESSIONAL**: puede confirmar/rechazar/completar reservas asignadas.\n'
        '- **ADMIN**: acceso completo a todos los recursos.\n'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # Esquema de seguridad JWT — aparece el botón Authorize en Swagger UI
    'SECURITY': [{'jwtAuth': []}],
    'SECURITY_DEFINITIONS': {
        'jwtAuth': {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': 'Token JWT. Obténlo con POST /api/auth/login/ → campo "access".',
        },
    },
    # Swagger UI customization
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,       # El token se guarda aunque recargues
        'displayRequestDuration': True,     # Muestra el tiempo de respuesta
        'filter': True,                     # Barra de filtro por endpoint
        'tryItOutEnabled': True,            # "Try it out" activado por defecto
        'deepLinking': True,
    },
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': True,
    # Formato: JSON es más compatible que YAML con Swagger UI en Vercel
    'PREPROCESSING_HOOKS': [],
    'POSTPROCESSING_HOOKS': ['drf_spectacular.hooks.postprocess_schema_enums'],
}

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'fmt': '%(asctime)s %(levelname)s %(name)s %(message)s %(pathname)s %(lineno)d',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        # On Vercel, stdout is the log sink.
        # Use FileHandler only in local development when not running on any cloud.
        'security_sink': {
            'class': 'logging.StreamHandler' if _is_cloud_proxy else 'logging.FileHandler',
            **({} if _is_cloud_proxy else {'filename': str(BASE_DIR / 'security.log')}),
            'formatter': 'json',
            'level': 'WARNING',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'security': {
            'handlers': ['console', 'security_sink'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
