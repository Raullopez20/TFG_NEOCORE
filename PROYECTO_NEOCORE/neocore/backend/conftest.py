"""
Fixtures compartidos para todos los tests del proyecto NeoCore.

Disponibles en todos los módulos de tests gracias a estar en el rootdir.
"""

import pytest
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


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
    """Factoría que crea y persiste usuarios de prueba."""

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
        last_name="Lopez",
        role=User.Role.CLIENT,
    )


@pytest.fixture
def professional_user(create_user):
    """Usuario con rol PROFESSIONAL."""
    return create_user(
        email="profesional@example.com",
        first_name="Laura",
        last_name="Martinez",
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


# ---------------------------------------------------------------------------
# Fixtures de servicios
# ---------------------------------------------------------------------------
@pytest.fixture
def service(db):
    """Servicio básico de 60 minutos."""
    from apps.services.models import Service
    return Service.objects.create(
        name="Fisioterapia Deportiva",
        description="Sesion de fisioterapia para deportistas",
        duration_minutes=60,
        price="45.00",
        is_active=True,
    )


@pytest.fixture
def inactive_service(db):
    """Servicio inactivo."""
    from apps.services.models import Service
    return Service.objects.create(
        name="Servicio Inactivo",
        description="Este servicio no esta disponible",
        duration_minutes=30,
        is_active=False,
    )


# ---------------------------------------------------------------------------
# Fixtures de reservas
# ---------------------------------------------------------------------------
@pytest.fixture
def future_datetimes():
    """Par de datetimes futuros para crear una reserva de 60 min."""
    start = timezone.now() + timedelta(days=2, hours=10)
    end = start + timedelta(minutes=60)
    return start, end


@pytest.fixture
def pending_booking(client_user, professional_user, service):
    """Reserva en estado PENDING."""
    from apps.bookings.models import Booking
    start = timezone.now() + timedelta(days=2)
    end = start + timedelta(minutes=60)
    b = Booking(
        client=client_user,
        professional=professional_user,
        service=service,
        start_datetime=start,
        end_datetime=end,
        status=Booking.Status.PENDING,
    )
    b.save()
    return b


@pytest.fixture
def confirmed_booking(pending_booking):
    """Reserva en estado CONFIRMED."""
    from apps.bookings.models import Booking
    Booking.objects.filter(pk=pending_booking.pk).update(status=Booking.Status.CONFIRMED)
    pending_booking.refresh_from_db()
    return pending_booking


@pytest.fixture
def done_booking(pending_booking):
    """Reserva en estado DONE."""
    from apps.bookings.models import Booking
    Booking.objects.filter(pk=pending_booking.pk).update(status=Booking.Status.DONE)
    pending_booking.refresh_from_db()
    return pending_booking
