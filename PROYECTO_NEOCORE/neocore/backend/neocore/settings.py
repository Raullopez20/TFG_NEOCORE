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
SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-this-in-production')

# Modo depuración: muestra errores detallados y desactiva ciertas protecciones.
# NUNCA activar en producción.
DEBUG = env('DEBUG')

# Lista de hosts/dominios permitidos para servir la aplicación.
# Protege contra ataques de tipo HTTP Host header.
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', 'web'])

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
    
    # --- Apps de terceros ---
    'rest_framework',                          # Django REST Framework para la API REST
    'rest_framework.authtoken',                # Autenticación basada en tokens
    'corsheaders',                             # Manejo de CORS (Cross-Origin Resource Sharing)
    'django_filters',                          # Filtros avanzados para las vistas de la API
    'drf_spectacular',                         # Generación automática de documentación OpenAPI/Swagger
    'allauth',                                 # Autenticación social y gestión de cuentas
    'allauth.account',                         # Gestión de cuentas de usuario (email, contraseña)
    'allauth.socialaccount',                   # Autenticación mediante proveedores sociales
    'allauth.socialaccount.providers.google',  # Proveedor de autenticación con Google
    'dj_rest_auth',                            # Endpoints REST para autenticación
    'dj_rest_auth.registration',               # Endpoints REST para registro de usuarios
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
    'corsheaders.middleware.CorsMiddleware',               # Gestión de cabeceras CORS
    'django.contrib.sessions.middleware.SessionMiddleware',# Manejo de sesiones de usuario
    'django.middleware.locale.LocaleMiddleware',           # Detección de idioma del usuario
    'django.middleware.common.CommonMiddleware',           # Funcionalidades HTTP comunes
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Asocia usuarios a las peticiones
    'django.contrib.messages.middleware.MessageMiddleware',    # Framework de mensajes flash
    'django.middleware.clickjacking.XFrameOptionsMiddleware', # Protección contra clickjacking
    'allauth.account.middleware.AccountMiddleware',            # Middleware de django-allauth
]

# Se añade la protección CSRF solo en producción.
# En desarrollo se omite para facilitar las pruebas con la API.
if not DEBUG:
    MIDDLEWARE.insert(6, 'django.middleware.csrf.CsrfViewMiddleware')

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
# Configuración de PostgreSQL como motor de base de datos principal.
# Los parámetros de conexión se obtienen del archivo .env para mantener
# las credenciales fuera del código fuente.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),        # Nombre de la base de datos
        'USER': env('POSTGRES_USER'),      # Usuario de PostgreSQL
        'PASSWORD': env('POSTGRES_PASSWORD'), # Contraseña del usuario
        'HOST': env('POSTGRES_HOST'),      # Host del servidor (ej: 'db' en Docker)
        'PORT': env('POSTGRES_PORT'),      # Puerto (por defecto 5432)
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
STATIC_URL = '/static/'
# Directorio donde collectstatic recopila todos los estáticos para producción
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []
# WhiteNoise comprime y cachea archivos estáticos para servir eficientemente
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ============================================================================
# ARCHIVOS MULTIMEDIA (subidos por los usuarios)
# ============================================================================
# URL pública para acceder a los archivos multimedia
MEDIA_URL = '/media/'
# Directorio donde se almacenan los archivos subidos (imágenes de perfil, servicios, etc.)
MEDIA_ROOT = BASE_DIR / 'media'

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
    # --- Autenticación ---
    # Métodos de autenticación soportados para las peticiones a la API.
    # SessionAuthentication: para el panel de admin y navegador.
    # JWTAuthentication: para el frontend (tokens Bearer en cabeceras).
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
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
        'anon': '100/hour',       # Máximo 100 peticiones/hora para anónimos
        'user': '1000/hour',      # Máximo 1000 peticiones/hora para autenticados
        'booking': '10/minute',   # Máximo 10 reservas/minuto (protección anti-spam)
    }
}

# ============================================================================
# SIMPLE JWT (Tokens de autenticación)
# ============================================================================
# Configuración de los tokens JWT (JSON Web Tokens) para la autenticación
# sin estado (stateless). Los tokens se envían en la cabecera Authorization.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),    # El token de acceso expira en 1 hora
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
    'JWT_AUTH_COOKIE': 'neocore-auth',              # Nombre de la cookie del token de acceso
    'JWT_AUTH_REFRESH_COOKIE': 'neocore-refresh',   # Nombre de la cookie del token de refresco
    'JWT_AUTH_HTTPONLY': False,                      # Permitir acceso a la cookie desde JavaScript
    'SESSION_LOGIN': False,                         # Desactivar login por sesión (evita problemas con CSRF)
    'USER_DETAILS_SERIALIZER': 'apps.users.serializers.UserSerializer',  # Serializador para los datos del usuario
    'LOGIN_SERIALIZER': 'dj_rest_auth.serializers.LoginSerializer',      # Serializador para el login
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
# La verificación de email es opcional (el usuario puede usarlo sin verificar)
ACCOUNT_EMAIL_VERIFICATION = 'optional'
# No se permiten emails duplicados en el sistema
ACCOUNT_UNIQUE_EMAIL = True

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
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:3000', 'http://127.0.0.1:3000']
)
# Permitir envío de cookies y credenciales en peticiones cross-origin
CORS_ALLOW_CREDENTIALS = True
# En desarrollo se permiten todos los orígenes para facilitar las pruebas
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
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:3000', 'http://127.0.0.1:3000']
)
CSRF_COOKIE_HTTPONLY = False      # Permitir acceso a la cookie CSRF desde JavaScript
CSRF_USE_SESSIONS = False         # Almacenar el token CSRF en cookie, no en sesión
CSRF_COOKIE_SAMESITE = 'Lax'     # Política SameSite para la cookie CSRF
CSRF_COOKIE_SECURE = False        # En desarrollo no se requiere HTTPS

# ============================================================================
# CORREO ELECTRÓNICO
# ============================================================================
# Configuración del servicio de email para enviar notificaciones,
# recordatorios de citas, confirmaciones de reserva, etc.
# Por defecto usa ConsoleEmailBackend que muestra los emails por consola
# (útil para desarrollo). En producción se configura un servidor SMTP real.
EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)  # Usar cifrado TLS
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='neocore@example.com')

# ============================================================================
# CELERY (Tareas asíncronas)
# ============================================================================
# Celery utiliza Redis como broker de mensajes y como backend de resultados.
# Permite ejecutar tareas en segundo plano como el envío de emails y recordatorios.
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://redis:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://redis:6379/0')
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
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://redis:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Security settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# Spectacular (API Documentation)
SPECTACULAR_SETTINGS = {
    'TITLE': 'NeoCore API',
    'DESCRIPTION': 'Sistema integral de reservas para centro de salud y bienestar',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
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
    },
}
