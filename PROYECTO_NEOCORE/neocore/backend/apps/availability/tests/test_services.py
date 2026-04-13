"""
Tests del servicio AvailabilityService.

Cubre:
  - validate_slot_available: profesional no existe, pasado, sin regla, time_off, solapado
  - get_available_slots: sin reglas, con regla, con time_off, con reserva
  - _slot_overlaps: lógica de solapamiento
  - _is_date_time_off: detección de ausencias
"""

import pytest
from datetime import date, time, timedelta, datetime
from unittest.mock import patch
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.availability.models import AvailabilityRule, TimeOff
from apps.availability.services import AvailabilityService

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def make_aware(dt):
    return timezone.make_aware(dt) if timezone.is_naive(dt) else dt


def future_date(days=7):
    return (timezone.now() + timedelta(days=days)).date()


# ---------------------------------------------------------------------------
# Tests de validate_slot_available
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestValidateSlotAvailable:
    """Tests de validación de slots específicos."""

    def test_profesional_no_existe_devuelve_false(self):
        start = timezone.now() + timedelta(days=1, hours=9)
        end = start + timedelta(minutes=60)
        ok, msg = AvailabilityService.validate_slot_available(99999, start, end)
        assert ok is False
        assert "not found" in msg.lower()

    def test_slot_en_el_pasado_devuelve_false(self, professional_user):
        start = timezone.now() - timedelta(hours=2)
        end = start + timedelta(minutes=60)
        ok, msg = AvailabilityService.validate_slot_available(professional_user.pk, start, end)
        assert ok is False
        assert "past" in msg.lower()

    def test_sin_regla_de_disponibilidad_devuelve_false(self, professional_user):
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(minutes=60)
        ok, msg = AvailabilityService.validate_slot_available(professional_user.pk, start, end)
        assert ok is False
        assert "availability" in msg.lower()

    def test_slot_dentro_de_regla_devuelve_true(self, professional_user):
        # Crear una regla que cubra el slot
        start = timezone.now() + timedelta(days=2)
        # Ajustar al mismo día de semana que la regla que vamos a crear
        day_of_week = start.weekday()

        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=day_of_week,
            start_time=time(8, 0),
            end_time=time(18, 0),
        )

        slot_start = make_aware(datetime.combine(start.date(), time(10, 0)))
        slot_end = slot_start + timedelta(minutes=60)

        ok, msg = AvailabilityService.validate_slot_available(
            professional_user.pk, slot_start, slot_end
        )
        assert ok is True
        assert msg == ""

    def test_time_off_bloquea_slot(self, professional_user):
        start = timezone.now() + timedelta(days=5)
        day_of_week = start.weekday()

        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=day_of_week,
            start_time=time(8, 0),
            end_time=time(18, 0),
        )
        TimeOff.objects.create(
            professional=professional_user,
            start_date=start.date(),
            end_date=start.date(),
        )

        slot_start = make_aware(datetime.combine(start.date(), time(10, 0)))
        slot_end = slot_start + timedelta(minutes=60)

        ok, msg = AvailabilityService.validate_slot_available(
            professional_user.pk, slot_start, slot_end
        )
        assert ok is False
        assert "not available" in msg.lower()

    def test_slot_solapado_con_reserva_devuelve_false(self, professional_user, client_user, service):
        from apps.bookings.models import Booking
        start = timezone.now() + timedelta(days=3)
        day_of_week = start.weekday()

        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=day_of_week,
            start_time=time(8, 0),
            end_time=time(18, 0),
        )

        slot_start = make_aware(datetime.combine(start.date(), time(10, 0)))
        slot_end = slot_start + timedelta(minutes=60)

        # Crear una reserva que solapa con el slot
        b = Booking(
            client=client_user,
            professional=professional_user,
            service=service,
            start_datetime=slot_start,
            end_datetime=slot_end,
        )
        b.save()

        ok, msg = AvailabilityService.validate_slot_available(
            professional_user.pk, slot_start, slot_end
        )
        assert ok is False
        assert "booked" in msg.lower()


# ---------------------------------------------------------------------------
# Tests de get_available_slots
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestGetAvailableSlots:
    """Tests de generación de slots disponibles."""

    def test_sin_reglas_devuelve_lista_vacia(self, professional_user):
        start = future_date(7)
        end = future_date(14)
        slots = AvailabilityService.get_available_slots(
            professional_user.pk, 60, start, end
        )
        assert slots == []

    def test_profesional_inexistente_devuelve_lista_vacia(self):
        start = future_date(7)
        end = future_date(14)
        slots = AvailabilityService.get_available_slots(99999, 60, start, end)
        assert slots == []

    def test_con_regla_genera_slots(self, professional_user):
        # Crear regla para todos los días de la semana
        for day in range(7):
            AvailabilityRule.objects.create(
                professional=professional_user,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )
        start = future_date(8)
        end = future_date(9)
        slots = AvailabilityService.get_available_slots(
            professional_user.pk, 60, start, end
        )
        assert len(slots) > 0
        for slot in slots:
            assert 'start_datetime' in slot
            assert 'end_datetime' in slot
            assert slot['is_available'] is True

    def test_time_off_excluye_dias(self, professional_user):
        target_date = future_date(10)
        day_of_week = target_date.weekday()
        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=day_of_week,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        TimeOff.objects.create(
            professional=professional_user,
            start_date=target_date,
            end_date=target_date,
        )
        slots = AvailabilityService.get_available_slots(
            professional_user.pk, 60, target_date, target_date
        )
        assert slots == []

    def test_reserva_existente_excluye_slot(self, professional_user, client_user, service):
        from apps.bookings.models import Booking
        target_date = future_date(12)
        day_of_week = target_date.weekday()
        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=day_of_week,
            start_time=time(9, 0),
            end_time=time(11, 0),
        )
        slot_start = make_aware(datetime.combine(target_date, time(9, 0)))
        slot_end = slot_start + timedelta(minutes=60)
        b = Booking(
            client=client_user,
            professional=professional_user,
            service=service,
            start_datetime=slot_start,
            end_datetime=slot_end,
        )
        b.save()

        slots = AvailabilityService.get_available_slots(
            professional_user.pk, 60, target_date, target_date
        )
        # El slot de las 9:00 está ocupado
        occupied_starts = [slot_start]
        for slot in slots:
            assert slot['start_datetime'] not in occupied_starts


# ---------------------------------------------------------------------------
# Tests de métodos internos
# ---------------------------------------------------------------------------
class TestSlotOverlaps:
    """Tests de la lógica de solapamiento de slots."""

    def test_sin_solapamiento(self):
        start = timezone.now()
        end = start + timedelta(hours=1)
        booked = {(start + timedelta(hours=2), start + timedelta(hours=3))}
        assert AvailabilityService._slot_overlaps(start, end, booked) is False

    def test_con_solapamiento_parcial(self):
        start = timezone.now()
        end = start + timedelta(hours=2)
        booked = {(start + timedelta(hours=1), start + timedelta(hours=3))}
        assert AvailabilityService._slot_overlaps(start, end, booked) is True

    def test_con_solapamiento_total(self):
        start = timezone.now()
        end = start + timedelta(hours=1)
        booked = {(start, end)}
        assert AvailabilityService._slot_overlaps(start, end, booked) is True

    def test_sin_reservas(self):
        start = timezone.now()
        end = start + timedelta(hours=1)
        assert AvailabilityService._slot_overlaps(start, end, set()) is False

    def test_adyacente_no_solapa(self):
        start = timezone.now()
        end = start + timedelta(hours=1)
        booked = {(end, end + timedelta(hours=1))}
        assert AvailabilityService._slot_overlaps(start, end, booked) is False


@pytest.mark.django_db
class TestIsDateTimeOff:
    """Tests de la detección de días de ausencia."""

    def test_fecha_fuera_de_ausencia(self, professional_user):
        TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 8, 1),
            end_date=date(2030, 8, 10),
        )
        time_offs = TimeOff.objects.filter(professional=professional_user)
        assert AvailabilityService._is_date_time_off(date(2030, 7, 31), time_offs) is False

    def test_fecha_dentro_de_ausencia(self, professional_user):
        TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 8, 1),
            end_date=date(2030, 8, 10),
        )
        time_offs = TimeOff.objects.filter(professional=professional_user)
        assert AvailabilityService._is_date_time_off(date(2030, 8, 5), time_offs) is True

    def test_fecha_inicio_de_ausencia(self, professional_user):
        TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 9, 1),
            end_date=date(2030, 9, 5),
        )
        time_offs = TimeOff.objects.filter(professional=professional_user)
        assert AvailabilityService._is_date_time_off(date(2030, 9, 1), time_offs) is True

    def test_sin_ausencias(self):
        time_offs = TimeOff.objects.none()
        assert AvailabilityService._is_date_time_off(date(2030, 8, 5), time_offs) is False
