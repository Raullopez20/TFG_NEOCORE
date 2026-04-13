"""
Configuración de Django para el entorno de tests.

Sobrescribe los ajustes que no son aptos para pruebas:
  - Base de datos: SQLite en memoria (sin necesidad de PostgreSQL)
  - Caché: memoria local (sin Redis)
  - Rate limiting / Axes: desactivados para no interferir con las pruebas
  - SSL redirect: desactivado
  - Verificación de email: desactivada
  - Hasher de contraseñas: MD5 (más rápido en tests)
"""

import os

from cryptography.fernet import Fernet

# ---------------------------------------------------------------------------
# Variables de entorno — deben establecerse ANTES de importar settings.py
# ---------------------------------------------------------------------------
# Usamos SQLite en memoria para no necesitar PostgreSQL
os.environ["DATABASE_URL"] = "sqlite:///test_neocore.db"
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production-only-for-tests-1234")
# Clave Fernet válida (32 bytes en base64 URL-safe)
os.environ.setdefault("FIELD_ENCRYPTION_KEY", Fernet.generate_key().decode())
os.environ.setdefault("ADMIN_PATH", "admin-test/")
os.environ.setdefault("ADMIN_ALLOWED_IPS", "127.0.0.1")

# ---------------------------------------------------------------------------
# Importar la configuración base
# ---------------------------------------------------------------------------
from neocore.settings import *  # noqa: F401, F403, E402

# ---------------------------------------------------------------------------
# Base de datos — SQLite en memoria para mayor velocidad
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# ---------------------------------------------------------------------------
# Caché — memoria local (sin Redis)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ---------------------------------------------------------------------------
# Middlewares — eliminamos los que interfieren con los tests
# ---------------------------------------------------------------------------
_MW_REMOVE = {
    "neocore.middleware.SecurityAnalysisMiddleware",
    "neocore.middleware.SQLInjectionProtectionMiddleware",
    "neocore.middleware.AdminIPRestrictionMiddleware",
}
MIDDLEWARE = [m for m in MIDDLEWARE if m not in _MW_REMOVE]

# ---------------------------------------------------------------------------
# Rate limiting / Axes — desactivados completamente en tests
# ---------------------------------------------------------------------------
RATELIMIT_ENABLE = False
AXES_ENABLED = False

# ---------------------------------------------------------------------------
# Seguridad — relajada para el cliente de tests
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

# ---------------------------------------------------------------------------
# Contraseñas — hasher rápido para no penalizar los tests
# ---------------------------------------------------------------------------
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# ---------------------------------------------------------------------------
# Allauth / dj-rest-auth — sin verificación de email
# ---------------------------------------------------------------------------
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_CONFIRM_EMAIL_ON_GET = False

# ---------------------------------------------------------------------------
# Email — backend silencioso
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.dummy.EmailBackend"

# ---------------------------------------------------------------------------
# Celery — ejecución síncrona en tests
# ---------------------------------------------------------------------------
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
