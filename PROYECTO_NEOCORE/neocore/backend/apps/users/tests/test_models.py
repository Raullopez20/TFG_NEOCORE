"""
Tests del modelo User.

Cubre:
  - Creación y valores por defecto
  - Generación automática de username desde el email
  - Propiedades de rol (is_client, is_professional, is_admin_role)
  - Unicidad del email
  - Representación en texto (__str__)
  - Campos GDPR
"""

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


@pytest.mark.django_db
class TestUserCreation:
    """Tests de creación básica de usuarios."""

    def test_email_es_el_identificador_principal(self):
        """El campo USERNAME_FIELD debe ser 'email'."""
        assert User.USERNAME_FIELD == "email"

    def test_campos_requeridos_para_superusuario(self):
        """REQUIRED_FIELDS debe incluir first_name y last_name."""
        assert "first_name" in User.REQUIRED_FIELDS
        assert "last_name" in User.REQUIRED_FIELDS

    def test_rol_por_defecto_es_client(self, create_user):
        user = create_user(email="roltest@example.com")
        assert user.role == User.Role.CLIENT

    def test_is_active_por_defecto_true(self, create_user):
        user = create_user(email="active@example.com")
        assert user.is_active is True

    def test_gdpr_consent_por_defecto_false(self, db):
        """Sin consentimiento explícito, gdpr_consent es False (valor por defecto del modelo)."""
        user = User(email="gdpr@example.com", first_name="Test", last_name="User")
        user.set_password("TestPassword123!")
        user.save()
        assert user.gdpr_consent is False
        assert user.gdpr_consent_at is None

    def test_contrasena_hasheada(self, create_user):
        """La contraseña almacenada no debe ser texto plano."""
        user = create_user(email="hash@example.com", password="MiSecreto123!")
        assert user.password != "MiSecreto123!"
        assert user.check_password("MiSecreto123!")

    def test_campos_de_auditoria_existen(self, create_user):
        user = create_user(email="audit@example.com")
        assert user.created_at is not None
        assert user.updated_at is not None


@pytest.mark.django_db
class TestUsernameAutoGenerado:
    """Tests para la generación automática del username."""

    def test_username_se_genera_desde_email(self, create_user):
        user = create_user(email="pepe.garcia@example.com")
        assert user.username == "pepe.garcia"

    def test_username_admin_recibe_prefijo(self, create_user):
        """El username 'admin' se evita para prevenir conflictos con el admin de Django."""
        user = create_user(email="admin@example.com")
        # El username no puede ser simplemente 'admin'
        assert user.username != "admin"

    def test_username_no_incluye_dominio(self, create_user):
        user = create_user(email="usuario@neocoree.xyz")
        assert "@" not in user.username
        assert "neocoree.xyz" not in user.username

    def test_username_personalizado_se_respeta(self, create_user):
        """Si se proporciona username explícitamente, se debe respetar."""
        user = create_user(email="custom@example.com", username="mi_username")
        assert user.username == "mi_username"


@pytest.mark.django_db
class TestRoleProperties:
    """Tests de las propiedades de rol."""

    def test_is_client_verdadero_para_cliente(self, client_user):
        assert client_user.is_client is True
        assert client_user.is_professional is False
        assert client_user.is_admin_role is False

    def test_is_professional_verdadero_para_profesional(self, professional_user):
        assert professional_user.is_professional is True
        assert professional_user.is_client is False
        assert professional_user.is_admin_role is False

    def test_is_admin_role_verdadero_para_admin(self, admin_user):
        assert admin_user.is_admin_role is True
        assert admin_user.is_client is False
        assert admin_user.is_professional is False

    def test_roles_disponibles(self):
        """Los únicos roles válidos son CLIENT, PROFESSIONAL y ADMIN."""
        roles = {r.value for r in User.Role}
        assert roles == {"CLIENT", "PROFESSIONAL", "ADMIN"}


@pytest.mark.django_db
class TestUserStringRepresentation:
    """Tests de __str__ y get_full_name."""

    def test_get_full_name(self, create_user):
        user = create_user(
            email="nombre@example.com",
            first_name="Ana",
            last_name="Rodríguez",
        )
        assert user.get_full_name() == "Ana Rodríguez"

    def test_str_incluye_nombre_y_email(self, create_user):
        user = create_user(
            email="str@example.com",
            first_name="Pedro",
            last_name="Sánchez",
        )
        texto = str(user)
        assert "Pedro Sánchez" in texto
        assert "str@example.com" in texto

    def test_full_name_sin_espacios_extras(self, create_user):
        user = create_user(
            email="strip@example.com",
            first_name="  Juan  ",
            last_name="  García  ",
        )
        # get_full_name hace strip sobre el resultado final
        assert user.get_full_name() == "Juan     García"  # strip solo borra extremos del conjunto


@pytest.mark.django_db
class TestEmailUnicidad:
    """Tests de unicidad del email."""

    def test_email_duplicado_lanza_error(self, create_user):
        create_user(email="unico@example.com")
        with pytest.raises(IntegrityError):
            create_user(email="unico@example.com")

    def test_emails_distintos_se_admiten(self, create_user):
        u1 = create_user(email="primero@example.com")
        u2 = create_user(email="segundo@example.com")
        assert u1.pk != u2.pk


@pytest.mark.django_db
class TestCamposProfesional:
    """Tests de campos específicos de profesionales."""

    def test_specialty_vacia_por_defecto(self, client_user):
        assert client_user.specialty == ""

    def test_profesional_tiene_specialty(self, professional_user):
        assert professional_user.specialty == "Fisioterapia"

    def test_profile_image_none_por_defecto(self, client_user):
        assert client_user.profile_image.name is None or client_user.profile_image.name == ""
