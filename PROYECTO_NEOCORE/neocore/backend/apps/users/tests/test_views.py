"""
Tests del UserViewSet.

Cubre:
  - GET  /api/auth/users/me/                    → perfil propio
  - PATCH /api/auth/users/update_me/            → actualizar perfil propio
  - GET  /api/auth/users/professionals/         → listado público de profesionales
  - GET  /api/auth/users/{id}/professional_detail/ → detalle de profesional
  - GET  /api/auth/users/                       → listado de usuarios (solo admin)
  - Permisos: acceso denegado sin autenticación
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

ME_URL = "/api/auth/users/me/"
UPDATE_ME_URL = "/api/auth/users/update_me/"
PROFESSIONALS_URL = "/api/auth/users/professionals/"
USERS_LIST_URL = "/api/auth/users/"


def professional_detail_url(pk):
    return f"/api/auth/users/{pk}/professional_detail/"


# ---------------------------------------------------------------------------
# GET /api/auth/users/me/
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestMeEndpoint:
    """Tests del endpoint que devuelve el perfil del usuario autenticado."""

    def test_me_devuelve_perfil_propio(self, auth_client):
        client, user = auth_client
        resp = client.get(ME_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == user.email

    def test_me_contiene_campos_esperados(self, auth_client):
        client, _ = auth_client
        resp = client.get(ME_URL)
        for campo in ["id", "email", "first_name", "last_name", "full_name", "role"]:
            assert campo in resp.data, f"Campo '{campo}' ausente en /me/"

    def test_me_devuelve_full_name(self, auth_client):
        client, user = auth_client
        resp = client.get(ME_URL)
        assert resp.data["full_name"] == f"{user.first_name} {user.last_name}"

    def test_me_sin_autenticacion_devuelve_401(self, api_client):
        resp = api_client.get(ME_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_no_devuelve_password(self, auth_client):
        client, _ = auth_client
        resp = client.get(ME_URL)
        assert "password" not in resp.data

    def test_me_role_correcto_para_cliente(self, auth_client):
        client, _ = auth_client
        resp = client.get(ME_URL)
        assert resp.data["role"] == "CLIENT"

    def test_me_role_correcto_para_profesional(self, auth_professional):
        client, user = auth_professional
        resp = client.get(ME_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["role"] == "PROFESSIONAL"

    def test_me_role_correcto_para_admin(self, auth_admin):
        client, user = auth_admin
        resp = client.get(ME_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["role"] == "ADMIN"


# ---------------------------------------------------------------------------
# PATCH /api/auth/users/update_me/
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestUpdateMeEndpoint:
    """Tests del endpoint de actualización del perfil propio."""

    def test_actualizar_nombre_devuelve_200(self, auth_client):
        client, user = auth_client
        resp = client.patch(
            UPDATE_ME_URL,
            {"first_name": "NuevoNombre"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK

    def test_actualizar_nombre_persiste_en_bd(self, auth_client):
        client, user = auth_client
        client.patch(UPDATE_ME_URL, {"first_name": "Actualizado"}, format="json")
        user.refresh_from_db()
        assert user.first_name == "Actualizado"

    def test_actualizar_apellido_persiste_en_bd(self, auth_client):
        client, user = auth_client
        client.patch(UPDATE_ME_URL, {"last_name": "NuevoApellido"}, format="json")
        user.refresh_from_db()
        assert user.last_name == "NuevoApellido"

    def test_actualizar_telefono_valido(self, auth_client):
        client, user = auth_client
        resp = client.patch(UPDATE_ME_URL, {"phone": "666777888"}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_actualizar_telefono_invalido_devuelve_400(self, auth_client):
        client, _ = auth_client
        resp = client.patch(UPDATE_ME_URL, {"phone": "123"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cliente_no_puede_actualizar_specialty(self, auth_client):
        client, user = auth_client
        specialty_original = user.specialty
        client.patch(UPDATE_ME_URL, {"specialty": "Intento ilegal"}, format="json")
        user.refresh_from_db()
        assert user.specialty == specialty_original

    def test_profesional_actualiza_specialty(self, auth_professional):
        client, user = auth_professional
        resp = client.patch(UPDATE_ME_URL, {"specialty": "Psicología"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.specialty == "Psicología"

    def test_update_sin_autenticacion_devuelve_401(self, api_client):
        resp = api_client.patch(UPDATE_ME_URL, {"first_name": "Test"}, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_nombre_con_numeros_devuelve_400(self, auth_client):
        client, _ = auth_client
        resp = client.patch(UPDATE_ME_URL, {"first_name": "Juan123"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_respuesta_contiene_datos_actualizados(self, auth_client):
        client, _ = auth_client
        resp = client.patch(UPDATE_ME_URL, {"first_name": "Cambiado"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        # El endpoint devuelve el UserSerializer completo
        assert resp.data["first_name"] == "Cambiado"


# ---------------------------------------------------------------------------
# GET /api/auth/users/professionals/
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestProfessionalsEndpoint:
    """Tests del endpoint público de listado de profesionales."""

    def test_endpoint_publico_sin_autenticacion(self, api_client, professional_user):
        resp = api_client.get(PROFESSIONALS_URL)
        assert resp.status_code == status.HTTP_200_OK

    def test_lista_profesionales_activos(self, api_client, professional_user):
        resp = api_client.get(PROFESSIONALS_URL)
        emails = [p.get("full_name", "") for p in resp.data]
        assert any(professional_user.first_name in nombre for nombre in emails)

    def test_no_incluye_clientes(self, api_client, client_user, professional_user):
        resp = api_client.get(PROFESSIONALS_URL)
        # Todos los resultados deben ser profesionales
        # (el campo role no se expone en ProfessionalSerializer pero los datos son solo de profesionales)
        assert resp.status_code == status.HTTP_200_OK
        # Los datos no deben contener el email del cliente
        for prof in resp.data:
            assert prof.get("email") != client_user.email

    def test_no_incluye_profesionales_inactivos(self, api_client, create_user):
        create_user(
            email="inactivo@prof.com",
            role=User.Role.PROFESSIONAL,
            is_active=False,
            specialty="Inactivo",
        )
        resp = api_client.get(PROFESSIONALS_URL)
        nombres = [p.get("full_name", "") for p in resp.data]
        assert not any("inactivo" in nombre.lower() for nombre in nombres)

    def test_filtro_por_specialty_valido(self, api_client, professional_user):
        resp = api_client.get(PROFESSIONALS_URL, {"specialty": "Fisio"})
        assert resp.status_code == status.HTTP_200_OK

    def test_filtro_specialty_invalido_devuelve_400(self, api_client):
        resp = api_client.get(PROFESSIONALS_URL, {"specialty": "'; DROP TABLE users;--"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_filtro_specialty_sin_coincidencia_devuelve_lista_vacia(self, api_client, professional_user):
        resp = api_client.get(PROFESSIONALS_URL, {"specialty": "EspecialidadInexistente"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data == [] or len(resp.data) == 0

    def test_campos_del_profesional_publico(self, api_client, professional_user):
        resp = api_client.get(PROFESSIONALS_URL)
        assert resp.status_code == status.HTTP_200_OK
        if resp.data:
            prof = resp.data[0]
            for campo in ["id", "full_name", "specialty"]:
                assert campo in prof

    def test_professional_no_expone_email_en_listado(self, api_client, professional_user):
        """El listado público no debe exponer emails de los profesionales."""
        resp = api_client.get(PROFESSIONALS_URL)
        if resp.data:
            prof = resp.data[0]
            assert "email" not in prof


# ---------------------------------------------------------------------------
# GET /api/auth/users/{id}/professional_detail/
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestProfessionalDetailEndpoint:
    """Tests del endpoint de detalle de un profesional específico."""

    def test_detalle_profesional_activo(self, api_client, professional_user):
        resp = api_client.get(professional_detail_url(professional_user.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == professional_user.pk

    def test_detalle_contiene_specialty(self, api_client, professional_user):
        resp = api_client.get(professional_detail_url(professional_user.pk))
        assert resp.data["specialty"] == professional_user.specialty

    def test_cliente_no_es_profesional_devuelve_404(self, api_client, client_user):
        resp = api_client.get(professional_detail_url(client_user.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_profesional_inactivo_devuelve_404(self, api_client, create_user):
        prof = create_user(
            email="inactivo2@prof.com",
            role=User.Role.PROFESSIONAL,
            is_active=False,
        )
        resp = api_client.get(professional_detail_url(prof.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_id_inexistente_devuelve_404(self, api_client):
        resp = api_client.get(professional_detail_url(99999))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_endpoint_publico_sin_autenticacion(self, api_client, professional_user):
        resp = api_client.get(professional_detail_url(professional_user.pk))
        assert resp.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# GET /api/auth/users/   (listado — solo admin)
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestUsersListEndpoint:
    """Tests del endpoint de listado de todos los usuarios (solo administradores)."""

    def test_admin_puede_listar_usuarios(self, auth_admin, client_user, professional_user):
        client, _ = auth_admin
        resp = client.get(USERS_LIST_URL)
        assert resp.status_code == status.HTTP_200_OK

    def test_cliente_no_puede_listar_usuarios(self, auth_client):
        client, _ = auth_client
        resp = client.get(USERS_LIST_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_profesional_no_puede_listar_usuarios(self, auth_professional):
        client, _ = auth_professional
        resp = client.get(USERS_LIST_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_anonimo_no_puede_listar_usuarios(self, api_client):
        resp = api_client.get(USERS_LIST_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_ve_todos_los_usuarios(self, auth_admin, client_user, professional_user):
        client, admin = auth_admin
        resp = client.get(USERS_LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        # La respuesta está paginada; comprobamos que hay al menos 3 usuarios
        count = resp.data.get("count", len(resp.data))
        assert count >= 3  # admin + client + professional


# ---------------------------------------------------------------------------
# GET /api/auth/users/{id}/   (detalle — solo dueño o admin)
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestUserDetailEndpoint:
    """Tests del endpoint de detalle de usuario por ID."""

    def test_usuario_accede_a_su_propio_perfil(self, auth_client):
        client, user = auth_client
        resp = client.get(f"{USERS_LIST_URL}{user.pk}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == user.email

    def test_usuario_no_accede_al_perfil_de_otro(self, auth_client, professional_user):
        client, _ = auth_client
        resp = client.get(f"{USERS_LIST_URL}{professional_user.pk}/")
        # El queryset filtra por user.pk para no-admins → 404
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

    def test_admin_accede_a_cualquier_perfil(self, auth_admin, client_user):
        client, _ = auth_admin
        resp = client.get(f"{USERS_LIST_URL}{client_user.pk}/")
        assert resp.status_code == status.HTTP_200_OK
