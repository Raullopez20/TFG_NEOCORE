"""
Fixtures compartidos para los tests del módulo de usuarios.

Proporciona:
  - Clientes HTTP (APIClient)
  - Usuarios de cada rol (CLIENT, PROFESSIONAL, ADMIN)
  - Helpers para obtener tokens JWT y autenticar peticiones
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# ---------------------------------------------------------------------------
# Datos de registro válidos reutilizables en varios tests
# ---------------------------------------------------------------------------
VALID_REGISTER_PAYLOAD = {
    "email": "nuevo@example.com",
    "password1": "TestPassword123!",
    "password2": "TestPassword123!",
    "first_name": "María",
    "last_name": "González",
    "phone": "612345678",
    "gdpr_consent": True,
}


# ---------------------------------------------------------------------------
# Cliente HTTP base
# ---------------------------------------------------------------------------
@pytest.fixture
def api_client():
    """APIClient de DRF sin autenticar."""
    return APIClient()


# ---------------------------------------------------------------------------
# Factoria de usuarios
# ---------------------------------------------------------------------------
@pytest.fixture
def create_user(db):
    """
    Factoria que crea y persiste usuarios de prueba.

    Uso::
        user = create_user(email='a@b.com', role='PROFESSIONAL')
    """

    def _create(**kwargs):
        defaults = {
            "email": "testuser@example.com",
            "first_name": "Test",
            "last_name": "User",
            "gdpr_consent": True,
        }
        defaults.update(kwargs)
        password = defaults.pop("password", "TestPassword123!")
        user = User(**defaults)
        user.set_password(password)
        user.save()
        return user

    return _create


# ---------------------------------------------------------------------------
# Usuarios con roles específicos
# ---------------------------------------------------------------------------
@pytest.fixture
def client_user(create_user):
    """Usuario con rol CLIENT."""
    return create_user(
        email="cliente@example.com",
        first_name="Carlos",
        last_name="López",
        role=User.Role.CLIENT,
    )


@pytest.fixture
def professional_user(create_user):
    """Usuario con rol PROFESSIONAL."""
    return create_user(
        email="profesional@example.com",
        first_name="Laura",
        last_name="Martínez",
        role=User.Role.PROFESSIONAL,
        specialty="Fisioterapia",
    )


@pytest.fixture
def admin_user(create_user):
    """Usuario con rol ADMIN (también is_staff=True)."""
    return create_user(
        email="admin@example.com",
        first_name="Admin",
        last_name="NeoCore",
        role=User.Role.ADMIN,
        is_staff=True,
    )


# ---------------------------------------------------------------------------
# Helper de tokens JWT
# ---------------------------------------------------------------------------
@pytest.fixture
def get_tokens():
    """Devuelve un callable que genera tokens JWT para un usuario dado."""

    def _get(user):
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    return _get


# ---------------------------------------------------------------------------
# Clientes HTTP autenticados
# ---------------------------------------------------------------------------
@pytest.fixture
def auth_client(api_client, client_user, get_tokens):
    """APIClient autenticado como CLIENT + el objeto usuario."""
    tokens = get_tokens(client_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return api_client, client_user


@pytest.fixture
def auth_professional(api_client, professional_user, get_tokens):
    """APIClient autenticado como PROFESSIONAL + el objeto usuario."""
    tokens = get_tokens(professional_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return api_client, professional_user


@pytest.fixture
def auth_admin(api_client, admin_user, get_tokens):
    """APIClient autenticado como ADMIN + el objeto usuario."""
    tokens = get_tokens(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return api_client, admin_user
