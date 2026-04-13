"""
Tests de los endpoints de autenticación.

Cubre:
  - POST /api/auth/register/   → registro de usuario
  - POST /api/auth/login/      → inicio de sesión con JWT
  - POST /api/auth/logout/     → cierre de sesión
  - POST /api/auth/token/refresh/ → refresco de token
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

REGISTER_URL = "/api/auth/register/"
LOGIN_URL = "/api/auth/login/"
LOGOUT_URL = "/api/auth/logout/"
TOKEN_REFRESH_URL = "/api/auth/token/refresh/"

# ---------------------------------------------------------------------------
# Payload de registro válido
# ---------------------------------------------------------------------------
VALID_REGISTER = {
    "email": "registro@example.com",
    "password1": "TestPassword123!",
    "password2": "TestPassword123!",
    "first_name": "Isabel",
    "last_name": "Torres",
    "phone": "634567890",
    "gdpr_consent": True,
}


# ---------------------------------------------------------------------------
# Tests de REGISTRO
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestRegistro:
    """Tests del endpoint de registro de nuevos usuarios."""

    def test_registro_valido_devuelve_201(self, api_client):
        resp = api_client.post(REGISTER_URL, VALID_REGISTER, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

    def test_registro_devuelve_tokens_jwt(self, api_client):
        resp = api_client.post(REGISTER_URL, VALID_REGISTER, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_registro_crea_usuario_en_bd(self, api_client):
        assert not User.objects.filter(email=VALID_REGISTER["email"]).exists()
        api_client.post(REGISTER_URL, VALID_REGISTER, format="json")
        assert User.objects.filter(email=VALID_REGISTER["email"]).exists()

    def test_registro_asigna_rol_client(self, api_client):
        api_client.post(REGISTER_URL, VALID_REGISTER, format="json")
        user = User.objects.get(email=VALID_REGISTER["email"])
        assert user.role == User.Role.CLIENT

    def test_registro_email_duplicado_devuelve_400(self, api_client, create_user):
        create_user(email=VALID_REGISTER["email"])
        resp = api_client.post(REGISTER_URL, VALID_REGISTER, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_registro_sin_gdpr_devuelve_400(self, api_client):
        data = {**VALID_REGISTER, "gdpr_consent": False}
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "gdpr_consent" in resp.data

    def test_registro_sin_first_name_devuelve_400(self, api_client):
        data = {**VALID_REGISTER, "first_name": ""}
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "first_name" in resp.data

    def test_registro_sin_last_name_devuelve_400(self, api_client):
        data = {**VALID_REGISTER, "last_name": ""}
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "last_name" in resp.data

    def test_registro_email_invalido_devuelve_400(self, api_client):
        data = {**VALID_REGISTER, "email": "noesunmail"}
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in resp.data

    def test_registro_contrasenas_no_coinciden_devuelve_400(self, api_client):
        data = {**VALID_REGISTER, "password2": "OtraContraseña999!"}
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_registro_telefono_invalido_devuelve_400(self, api_client):
        data = {**VALID_REGISTER, "phone": "123456789"}
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "phone" in resp.data

    def test_registro_telefono_optional(self, api_client):
        """El teléfono es opcional; sin él debe registrarse igualmente."""
        data = {k: v for k, v in VALID_REGISTER.items() if k != "phone"}
        data["email"] = "sintelef@example.com"
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

    def test_registro_nombre_con_numeros_devuelve_400(self, api_client):
        data = {**VALID_REGISTER, "first_name": "Juan123"}
        resp = api_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_registro_guarda_gdpr_consent_at(self, api_client):
        """Al registrarse con gdpr_consent=True, gdpr_consent_at debe quedar registrado."""
        api_client.post(REGISTER_URL, VALID_REGISTER, format="json")
        user = User.objects.get(email=VALID_REGISTER["email"])
        assert user.gdpr_consent is True
        assert user.gdpr_consent_at is not None


# ---------------------------------------------------------------------------
# Tests de LOGIN
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestLogin:
    """Tests del endpoint de inicio de sesión."""

    def test_login_credenciales_correctas_devuelve_200(self, api_client, client_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": client_user.email, "password": "TestPassword123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK

    def test_login_devuelve_access_token(self, api_client, client_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": client_user.email, "password": "TestPassword123!"},
            format="json",
        )
        assert "access" in resp.data

    def test_login_devuelve_refresh_token(self, api_client, client_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": client_user.email, "password": "TestPassword123!"},
            format="json",
        )
        assert "refresh" in resp.data

    def test_login_devuelve_datos_usuario(self, api_client, client_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": client_user.email, "password": "TestPassword123!"},
            format="json",
        )
        assert "user" in resp.data
        assert resp.data["user"]["email"] == client_user.email

    def test_login_contrasena_incorrecta_devuelve_400(self, api_client, client_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": client_user.email, "password": "ContraseñaEquivocada!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_email_inexistente_devuelve_400(self, api_client):
        resp = api_client.post(
            LOGIN_URL,
            {"email": "noexiste@example.com", "password": "TestPassword123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_usuario_inactivo_devuelve_error(self, api_client, create_user):
        user = create_user(email="inactivo@example.com", is_active=False)
        resp = api_client.post(
            LOGIN_URL,
            {"email": user.email, "password": "TestPassword123!"},
            format="json",
        )
        # Django y allauth devuelven 400 para usuarios inactivos
        assert resp.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN)

    def test_login_sin_email_devuelve_400(self, api_client):
        resp = api_client.post(
            LOGIN_URL,
            {"password": "TestPassword123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_sin_password_devuelve_400(self, api_client, client_user):
        resp = api_client.post(
            LOGIN_URL,
            {"email": client_user.email},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_access_token_es_jwt_valido(self, api_client, client_user):
        """El token devuelto debe tener formato JWT (3 partes separadas por punto)."""
        resp = api_client.post(
            LOGIN_URL,
            {"email": client_user.email, "password": "TestPassword123!"},
            format="json",
        )
        access = resp.data.get("access", "")
        partes = access.split(".")
        assert len(partes) == 3, "El access token no tiene formato JWT válido"


# ---------------------------------------------------------------------------
# Tests de LOGOUT
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestLogout:
    """
    Tests del endpoint de cierre de sesión.

    dj-rest-auth con USE_JWT=True requiere enviar el refresh token en el body
    para que sea invalidado (puesto en la blacklist de simplejwt).
    Sin el refresh token, devuelve 401.
    """

    def test_logout_con_refresh_token_devuelve_200(self, api_client, client_user, get_tokens):
        """El logout correcto requiere access + refresh tokens."""
        tokens = get_tokens(client_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        resp = api_client.post(LOGOUT_URL, {"refresh": tokens["refresh"]}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_logout_sin_refresh_token_devuelve_401(self, api_client, client_user, get_tokens):
        """Sin el refresh token en el body, dj-rest-auth devuelve 401."""
        tokens = get_tokens(client_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        resp = api_client.post(LOGOUT_URL, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_sin_autenticar_devuelve_401(self, api_client):
        """Sin refresh token ni autenticación, devuelve 401."""
        resp = api_client.post(LOGOUT_URL, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_invalida_refresh_token(self, api_client, client_user, get_tokens):
        """Tras hacer logout, el refresh token anterior no debe funcionar."""
        tokens = get_tokens(client_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        # Logout enviando el refresh token para que sea invalidado (blacklist)
        logout_resp = api_client.post(
            LOGOUT_URL, {"refresh": tokens["refresh"]}, format="json"
        )
        assert logout_resp.status_code == status.HTTP_200_OK

        # Intentar refrescar con el token ya invalidado debe fallar
        api_client.credentials()  # quitar auth header
        resp = api_client.post(
            TOKEN_REFRESH_URL, {"refresh": tokens["refresh"]}, format="json"
        )
        assert resp.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        )


# ---------------------------------------------------------------------------
# Tests de TOKEN REFRESH
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestTokenRefresh:
    """Tests del endpoint de refresco de token JWT."""

    def test_refresh_valido_devuelve_nuevo_access(self, api_client, client_user, get_tokens):
        tokens = get_tokens(client_user)
        resp = api_client.post(
            TOKEN_REFRESH_URL,
            {"refresh": tokens["refresh"]},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data

    def test_refresh_invalido_devuelve_401(self, api_client):
        resp = api_client.post(
            TOKEN_REFRESH_URL,
            {"refresh": "tokeninvalido.queno.existe"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_vacio_devuelve_400(self, api_client):
        resp = api_client.post(TOKEN_REFRESH_URL, {"refresh": ""}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_refresh_sin_campo_devuelve_400(self, api_client):
        resp = api_client.post(TOKEN_REFRESH_URL, {}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nuevo_access_tiene_formato_jwt(self, api_client, client_user, get_tokens):
        tokens = get_tokens(client_user)
        resp = api_client.post(
            TOKEN_REFRESH_URL,
            {"refresh": tokens["refresh"]},
            format="json",
        )
        access = resp.data.get("access", "")
        assert len(access.split(".")) == 3
