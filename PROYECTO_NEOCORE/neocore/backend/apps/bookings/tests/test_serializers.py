"""
Tests de los serializadores de reservas.

Cubre:
  - BookingCreateSerializer: validaciones temporales, disponibilidad, duración
  - BookingUpdateSerializer: restricción de notas del profesional para clientes
  - ReviewCreateSerializer: validaciones de propietario, estado y duplicado
"""

import pytest
from datetime import timedelta
from unittest.mock import patch
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from apps.bookings.models import Booking, Review
from apps.bookings.serializers import (
    BookingCreateSerializer,
    BookingUpdateSerializer,
    ReviewCreateSerializer,
)


def make_request(user, factory=None):
    """Crea un request de prueba con el usuario autenticado."""
    if factory is None:
        factory = APIRequestFactory()
    request = factory.post('/')
    request.user = user
    return request


@pytest.mark.django_db
class TestBookingCreateSerializer:
    """Tests del serializador de creación de reservas."""

    @patch('apps.availability.services.AvailabilityService.validate_slot_available',
           return_value=(True, ''))
    def test_creacion_valida(self, mock_avail, client_user, professional_user, service):
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        request = make_request(client_user)
        serializer = BookingCreateSerializer(data=data, context={'request': request})
        assert serializer.is_valid(), serializer.errors

    def test_end_antes_de_start_falla(self, client_user, professional_user, service):
        start = timezone.now() + timedelta(days=2)
        end = start - timedelta(minutes=30)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        request = make_request(client_user)
        serializer = BookingCreateSerializer(data=data, context={'request': request})
        assert not serializer.is_valid()

    def test_fecha_en_el_pasado_falla(self, client_user, professional_user, service):
        start = timezone.now() - timedelta(hours=1)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        request = make_request(client_user)
        serializer = BookingCreateSerializer(data=data, context={'request': request})
        assert not serializer.is_valid()

    @patch('apps.availability.services.AvailabilityService.validate_slot_available',
           return_value=(True, ''))
    def test_duracion_no_coincide_con_servicio_falla(self, mock_avail, client_user, professional_user, service):
        """La duración de la reserva debe coincidir con la del servicio (60 min)."""
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(minutes=45)  # 45 min != 60 min del servicio
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        request = make_request(client_user)
        serializer = BookingCreateSerializer(data=data, context={'request': request})
        assert not serializer.is_valid()

    @patch('apps.availability.services.AvailabilityService.validate_slot_available',
           return_value=(False, 'Slot not within availability'))
    def test_slot_no_disponible_falla(self, mock_avail, client_user, professional_user, service):
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        request = make_request(client_user)
        serializer = BookingCreateSerializer(data=data, context={'request': request})
        assert not serializer.is_valid()

    @patch('apps.availability.services.AvailabilityService.validate_slot_available',
           return_value=(True, ''))
    def test_notas_cliente_limpian_html(self, mock_avail, client_user, professional_user, service):
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
            'client_notes': '<script>alert(1)</script>Nota limpia',
        }
        request = make_request(client_user)
        serializer = BookingCreateSerializer(data=data, context={'request': request})
        assert serializer.is_valid(), serializer.errors
        assert '<script>' not in serializer.validated_data['client_notes']

    def test_notas_cliente_demasiado_largas_fallan(self, client_user, professional_user, service):
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
            'client_notes': 'x' * 1001,
        }
        request = make_request(client_user)
        serializer = BookingCreateSerializer(data=data, context={'request': request})
        assert not serializer.is_valid()
        assert 'client_notes' in serializer.errors


@pytest.mark.django_db
class TestBookingUpdateSerializer:
    """Tests del serializador de actualización de notas."""

    def test_cliente_puede_actualizar_client_notes(self, pending_booking, client_user):
        request = make_request(client_user)
        serializer = BookingUpdateSerializer(
            pending_booking,
            data={'client_notes': 'Nuevas notas del cliente'},
            partial=True,
            context={'request': request},
        )
        assert serializer.is_valid(), serializer.errors

    def test_cliente_no_puede_actualizar_professional_notes(self, pending_booking, client_user):
        request = make_request(client_user)
        serializer = BookingUpdateSerializer(
            pending_booking,
            data={'professional_notes': 'Notas secretas'},
            partial=True,
            context={'request': request},
        )
        assert not serializer.is_valid()

    def test_profesional_puede_actualizar_professional_notes(self, pending_booking, professional_user):
        request = make_request(professional_user)
        serializer = BookingUpdateSerializer(
            pending_booking,
            data={'professional_notes': 'Notas internas'},
            partial=True,
            context={'request': request},
        )
        assert serializer.is_valid(), serializer.errors

    def test_notas_profesional_limpian_html(self, pending_booking, professional_user):
        request = make_request(professional_user)
        serializer = BookingUpdateSerializer(
            pending_booking,
            data={'professional_notes': '<b>Bold</b>Nota'},
            partial=True,
            context={'request': request},
        )
        assert serializer.is_valid(), serializer.errors
        assert '<b>' not in serializer.validated_data['professional_notes']

    def test_notas_profesional_demasiado_largas_fallan(self, pending_booking, professional_user):
        request = make_request(professional_user)
        serializer = BookingUpdateSerializer(
            pending_booking,
            data={'professional_notes': 'x' * 2001},
            partial=True,
            context={'request': request},
        )
        assert not serializer.is_valid()


@pytest.mark.django_db
class TestReviewCreateSerializer:
    """Tests del serializador de creación de reseñas."""

    def test_resena_valida_para_cita_done(self, done_booking, client_user):
        request = make_request(client_user)
        serializer = ReviewCreateSerializer(
            data={'booking': done_booking.pk, 'rating': 5, 'comment': 'Excelente'},
            context={'request': request},
        )
        assert serializer.is_valid(), serializer.errors

    def test_resena_en_cita_pending_falla(self, pending_booking, client_user):
        request = make_request(client_user)
        serializer = ReviewCreateSerializer(
            data={'booking': pending_booking.pk, 'rating': 4},
            context={'request': request},
        )
        assert not serializer.is_valid()

    def test_otro_usuario_no_puede_resenar(self, done_booking, create_user):
        otro = create_user(email="otro@example.com", role='CLIENT')
        request = make_request(otro)
        serializer = ReviewCreateSerializer(
            data={'booking': done_booking.pk, 'rating': 3},
            context={'request': request},
        )
        assert not serializer.is_valid()

    def test_resena_duplicada_falla(self, done_booking, client_user):
        Review.objects.create(booking=done_booking, rating=5)
        request = make_request(client_user)
        serializer = ReviewCreateSerializer(
            data={'booking': done_booking.pk, 'rating': 4},
            context={'request': request},
        )
        assert not serializer.is_valid()

    def test_comentario_con_html_es_sanitizado(self, done_booking, client_user):
        request = make_request(client_user)
        serializer = ReviewCreateSerializer(
            data={'booking': done_booking.pk, 'rating': 4,
                  'comment': '<script>alert(1)</script>Buen servicio'},
            context={'request': request},
        )
        assert serializer.is_valid(), serializer.errors
        assert '<script>' not in serializer.validated_data['comment']

    def test_comentario_demasiado_largo_falla(self, done_booking, client_user):
        request = make_request(client_user)
        serializer = ReviewCreateSerializer(
            data={'booking': done_booking.pk, 'rating': 4, 'comment': 'x' * 2001},
            context={'request': request},
        )
        assert not serializer.is_valid()
