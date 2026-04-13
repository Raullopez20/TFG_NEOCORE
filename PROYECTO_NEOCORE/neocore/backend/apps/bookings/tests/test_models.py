"""
Tests del modelo Booking y Review.

Cubre:
  - Creación de reservas y valores por defecto
  - Propiedades: duration_minutes, is_past, is_upcoming
  - Métodos: can_be_confirmed, can_be_rejected, can_be_canceled, can_be_reviewed
  - Validaciones del modelo (clean)
  - Modelo Review: creación, validación, __str__
"""

import pytest
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.bookings.models import Booking, Review

User = get_user_model()


@pytest.mark.django_db
class TestBookingCreation:
    """Tests de creación básica de reservas."""

    def test_booking_se_crea_con_estado_pending(self, pending_booking):
        assert pending_booking.status == Booking.Status.PENDING

    def test_booking_tiene_campos_de_auditoria(self, pending_booking):
        assert pending_booking.created_at is not None
        assert pending_booking.updated_at is not None

    def test_booking_tiene_campos_correctos(self, pending_booking, client_user, professional_user, service):
        assert pending_booking.client == client_user
        assert pending_booking.professional == professional_user
        assert pending_booking.service == service

    def test_booking_str_contiene_datos_relevantes(self, pending_booking, client_user, professional_user):
        texto = str(pending_booking)
        assert client_user.get_full_name() in texto
        assert professional_user.get_full_name() in texto


@pytest.mark.django_db
class TestBookingValidations:
    """Tests de las validaciones del modelo Booking."""

    def test_end_antes_de_start_falla(self, client_user, professional_user, service):
        start = timezone.now() + timedelta(days=1)
        end = start - timedelta(minutes=30)
        b = Booking(
            client=client_user,
            professional=professional_user,
            service=service,
            start_datetime=start,
            end_datetime=end,
        )
        with pytest.raises(ValidationError):
            b.save()

    def test_cliente_con_rol_incorrecto_falla(self, professional_user, service, create_user):
        admin = create_user(email="admin2@test.com", role=User.Role.ADMIN)
        start = timezone.now() + timedelta(days=1)
        b = Booking(
            client=admin,
            professional=professional_user,
            service=service,
            start_datetime=start,
            end_datetime=start + timedelta(minutes=60),
        )
        with pytest.raises(ValidationError):
            b.save()

    def test_profesional_con_rol_incorrecto_falla(self, client_user, service, create_user):
        admin = create_user(email="adminprof@test.com", role=User.Role.ADMIN)
        start = timezone.now() + timedelta(days=1)
        b = Booking(
            client=client_user,
            professional=admin,
            service=service,
            start_datetime=start,
            end_datetime=start + timedelta(minutes=60),
        )
        with pytest.raises(ValidationError):
            b.save()


@pytest.mark.django_db
class TestBookingProperties:
    """Tests de las propiedades calculadas del modelo."""

    def test_duration_minutes_calcula_correctamente(self, pending_booking):
        assert pending_booking.duration_minutes == 60

    def test_is_past_false_para_reserva_futura(self, pending_booking):
        assert pending_booking.is_past is False

    def test_is_past_true_para_reserva_pasada(self, client_user, professional_user, service):
        start = timezone.now() - timedelta(days=2)
        end = start + timedelta(minutes=60)
        b = Booking(
            client=client_user,
            professional=professional_user,
            service=service,
            start_datetime=start,
            end_datetime=end,
        )
        b.save()
        assert b.is_past is True

    def test_is_upcoming_false_para_pending(self, pending_booking):
        assert pending_booking.is_upcoming is False

    def test_is_upcoming_true_para_confirmed_futuro(self, confirmed_booking):
        assert confirmed_booking.is_upcoming is True

    def test_is_upcoming_false_para_done(self, done_booking):
        assert done_booking.is_upcoming is False


@pytest.mark.django_db
class TestBookingStateMachine:
    """Tests de los métodos que controlan transiciones de estado."""

    def test_pending_puede_confirmarse(self, pending_booking):
        assert pending_booking.can_be_confirmed() is True

    def test_confirmed_no_puede_confirmarse(self, confirmed_booking):
        assert confirmed_booking.can_be_confirmed() is False

    def test_pending_puede_rechazarse(self, pending_booking):
        assert pending_booking.can_be_rejected() is True

    def test_confirmed_no_puede_rechazarse(self, confirmed_booking):
        assert confirmed_booking.can_be_rejected() is False

    def test_pending_puede_cancelarse(self, pending_booking):
        assert pending_booking.can_be_canceled() is True

    def test_confirmed_puede_cancelarse(self, confirmed_booking):
        assert confirmed_booking.can_be_canceled() is True

    def test_done_no_puede_cancelarse(self, done_booking):
        assert done_booking.can_be_canceled() is False

    def test_done_puede_recibir_resena(self, done_booking):
        assert done_booking.can_be_reviewed() is True

    def test_pending_no_puede_recibir_resena(self, pending_booking):
        assert pending_booking.can_be_reviewed() is False


@pytest.mark.django_db
class TestReviewModel:
    """Tests del modelo Review."""

    def test_resena_se_crea_para_cita_done(self, done_booking):
        review = Review(booking=done_booking, rating=5, comment="Excelente")
        review.save()
        assert review.pk is not None

    def test_resena_en_cita_pending_falla(self, pending_booking):
        review = Review(booking=pending_booking, rating=4)
        with pytest.raises(ValidationError):
            review.save()

    def test_rating_valido_entre_1_y_5(self, done_booking):
        for r in range(1, 6):
            Review.objects.filter(booking=done_booking).delete()
            rev = Review(booking=done_booking, rating=r)
            rev.save()
            assert rev.rating == r

    def test_is_visible_por_defecto_true(self, done_booking):
        review = Review(booking=done_booking, rating=3)
        review.save()
        assert review.is_visible is True

    def test_resena_str_contiene_rating(self, done_booking):
        review = Review(booking=done_booking, rating=5)
        review.save()
        assert "5" in str(review)

    def test_comentario_vacio_permitido(self, done_booking):
        review = Review(booking=done_booking, rating=4, comment="")
        review.save()
        assert review.comment == ""
