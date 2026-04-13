"""
Tests del BookingViewSet y ReviewViewSet.

Cubre:
  - GET    /api/bookings/              → listado filtrado por rol
  - POST   /api/bookings/              → crear reserva (solo clientes)
  - GET    /api/bookings/{id}/         → detalle de reserva
  - PATCH  /api/bookings/{id}/         → actualizar notas
  - POST   /api/bookings/{id}/confirm/ → confirmar (profesional)
  - POST   /api/bookings/{id}/reject/  → rechazar (profesional)
  - POST   /api/bookings/{id}/cancel/  → cancelar
  - POST   /api/bookings/{id}/mark_done/ → marcar como hecha
  - GET    /api/bookings/upcoming/     → próximas reservas
  - GET    /api/bookings/past/         → reservas pasadas
  - GET    /api/bookings/stats/        → estadísticas (admin)
  - Reviews CRUD
"""

import pytest
from datetime import timedelta
from unittest.mock import patch
from django.utils import timezone
from rest_framework import status

from apps.bookings.models import Booking, Review

BOOKINGS_URL = "/api/bookings/"
REVIEWS_URL = "/api/reviews/"


def booking_action_url(pk, action):
    return f"/api/bookings/{pk}/{action}/"


def review_detail_url(pk):
    return f"/api/reviews/{pk}/"


def get_results(resp):
    """Extrae lista de resultados de respuesta paginada o simple."""
    if hasattr(resp.data, 'get') and 'results' in resp.data:
        return resp.data['results']
    return resp.data


# ---------------------------------------------------------------------------
# Tests de listado de reservas
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingsListado:
    """Tests de listado de reservas según el rol del usuario."""

    def test_cliente_ve_solo_sus_reservas(self, auth_client, pending_booking):
        client, user = auth_client
        resp = client.get(BOOKINGS_URL)
        assert resp.status_code == status.HTTP_200_OK
        results = get_results(resp)
        assert len(results) >= 1
        for b in results:
            assert b['client'] == user.pk

    def test_profesional_ve_sus_reservas(self, auth_professional, pending_booking):
        client, user = auth_professional
        resp = client.get(BOOKINGS_URL)
        assert resp.status_code == status.HTTP_200_OK
        results = get_results(resp)
        for b in results:
            assert b['professional'] == user.pk

    def test_admin_ve_todas_las_reservas(self, auth_admin, pending_booking):
        client, _ = auth_admin
        resp = client.get(BOOKINGS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(get_results(resp)) >= 1

    def test_anonimo_no_puede_listar(self, api_client, pending_booking):
        resp = api_client.get(BOOKINGS_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filtro_por_status(self, auth_client, pending_booking):
        client, _ = auth_client
        resp = client.get(BOOKINGS_URL, {'status': 'PENDING'})
        assert resp.status_code == status.HTTP_200_OK
        for b in get_results(resp):
            assert b['status'] == 'PENDING'


# ---------------------------------------------------------------------------
# Tests de creación de reservas
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingCreacion:
    """Tests del endpoint de creación de reservas."""

    @patch('apps.availability.services.AvailabilityService.validate_slot_available',
           return_value=(True, ''))
    def test_cliente_puede_crear_reserva(self, mock_avail, auth_client, professional_user, service):
        client, user = auth_client
        start = timezone.now() + timedelta(days=3)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        resp = client.post(BOOKINGS_URL, data, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    def test_profesional_no_puede_crear_reserva(self, auth_professional, professional_user, service):
        client, _ = auth_professional
        start = timezone.now() + timedelta(days=3)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        resp = client.post(BOOKINGS_URL, data, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_no_puede_crear_reserva_como_cliente(self, auth_admin, professional_user, service):
        client, _ = auth_admin
        start = timezone.now() + timedelta(days=3)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        resp = client.post(BOOKINGS_URL, data, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_fecha_pasada_devuelve_400(self, auth_client, professional_user, service):
        client, _ = auth_client
        start = timezone.now() - timedelta(hours=2)
        end = start + timedelta(minutes=60)
        data = {
            'service': service.pk,
            'professional': professional_user.pk,
            'start_datetime': start.isoformat(),
            'end_datetime': end.isoformat(),
        }
        resp = client.post(BOOKINGS_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Tests de detalle de reserva
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingDetalle:
    """Tests del endpoint de detalle de reserva."""

    def test_cliente_accede_a_su_reserva(self, auth_client, pending_booking):
        client, _ = auth_client
        resp = client.get(f"/api/bookings/{pending_booking.pk}/")
        assert resp.status_code == status.HTTP_200_OK

    def test_cliente_no_accede_a_reserva_ajena(self, auth_client, create_user, service):
        client, _ = auth_client
        otro_cliente = create_user(email="otro@test.com", role='CLIENT')
        prof = create_user(email="prof2@test.com", role='PROFESSIONAL')
        start = timezone.now() + timedelta(days=1)
        b = Booking(client=otro_cliente, professional=prof, service=service,
                    start_datetime=start, end_datetime=start + timedelta(minutes=60))
        b.save()
        resp = client.get(f"/api/bookings/{b.pk}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_profesional_accede_a_su_reserva(self, auth_professional, pending_booking):
        client, _ = auth_professional
        resp = client.get(f"/api/bookings/{pending_booking.pk}/")
        assert resp.status_code == status.HTTP_200_OK

    def test_admin_accede_a_cualquier_reserva(self, auth_admin, pending_booking):
        client, _ = auth_admin
        resp = client.get(f"/api/bookings/{pending_booking.pk}/")
        assert resp.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Tests de confirmación
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingConfirm:
    """Tests del endpoint de confirmación de reservas."""

    def test_profesional_confirma_reserva_pendiente(self, auth_professional, pending_booking):
        client, _ = auth_professional
        resp = client.post(booking_action_url(pending_booking.pk, 'confirm'))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['status'] == 'CONFIRMED'

    def test_cliente_no_puede_confirmar(self, auth_client, pending_booking):
        client, _ = auth_client
        resp = client.post(booking_action_url(pending_booking.pk, 'confirm'))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_profesional_no_puede_confirmar_reserva_ajena(self, auth_professional, create_user, service):
        client, _ = auth_professional
        otro_prof = create_user(email="prof2@test.com", role='PROFESSIONAL')
        otro_cliente = create_user(email="cli2@test.com", role='CLIENT')
        start = timezone.now() + timedelta(days=1)
        b = Booking(client=otro_cliente, professional=otro_prof, service=service,
                    start_datetime=start, end_datetime=start + timedelta(minutes=60))
        b.save()
        resp = client.post(booking_action_url(b.pk, 'confirm'))
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_confirmar_reserva_ya_confirmada_devuelve_400(self, auth_professional, confirmed_booking):
        client, _ = auth_professional
        resp = client.post(booking_action_url(confirmed_booking.pk, 'confirm'))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Tests de rechazo
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingReject:
    """Tests del endpoint de rechazo de reservas."""

    def test_profesional_rechaza_reserva_pendiente(self, auth_professional, pending_booking):
        client, _ = auth_professional
        resp = client.post(booking_action_url(pending_booking.pk, 'reject'),
                          {'reason': 'No disponible'}, format='json')
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['status'] == 'REJECTED'

    def test_cliente_no_puede_rechazar(self, auth_client, pending_booking):
        client, _ = auth_client
        resp = client.post(booking_action_url(pending_booking.pk, 'reject'))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_rechazar_confirmada_devuelve_400(self, auth_professional, confirmed_booking):
        client, _ = auth_professional
        resp = client.post(booking_action_url(confirmed_booking.pk, 'reject'))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Tests de cancelación
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingCancel:
    """Tests del endpoint de cancelación de reservas."""

    def test_cliente_cancela_su_reserva(self, auth_client, pending_booking):
        client, _ = auth_client
        resp = client.post(booking_action_url(pending_booking.pk, 'cancel'),
                          {'reason': 'No puedo asistir'}, format='json')
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['status'] == 'CANCELED'

    def test_profesional_cancela_su_reserva(self, auth_professional, pending_booking):
        client, _ = auth_professional
        resp = client.post(booking_action_url(pending_booking.pk, 'cancel'))
        assert resp.status_code == status.HTTP_200_OK

    def test_admin_cancela_cualquier_reserva(self, auth_admin, pending_booking):
        client, _ = auth_admin
        resp = client.post(booking_action_url(pending_booking.pk, 'cancel'))
        assert resp.status_code == status.HTTP_200_OK

    def test_cancelar_done_devuelve_400(self, auth_client, done_booking):
        client, _ = auth_client
        resp = client.post(booking_action_url(done_booking.pk, 'cancel'))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Tests de mark_done
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingMarkDone:
    """Tests del endpoint de marcar como completada."""

    def test_profesional_marca_confirmed_como_done(self, auth_professional, confirmed_booking):
        client, _ = auth_professional
        resp = client.post(booking_action_url(confirmed_booking.pk, 'mark_done'))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['status'] == 'DONE'

    def test_cliente_no_puede_marcar_done(self, auth_client, confirmed_booking):
        client, _ = auth_client
        resp = client.post(booking_action_url(confirmed_booking.pk, 'mark_done'))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_pending_no_puede_marcarse_done(self, auth_professional, pending_booking):
        client, _ = auth_professional
        resp = client.post(booking_action_url(pending_booking.pk, 'mark_done'))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Tests de upcoming y past
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingUpcomingPast:
    """Tests de los endpoints de próximas y pasadas reservas."""

    def test_upcoming_incluye_reservas_pendientes_futuras(self, auth_client, pending_booking):
        client, _ = auth_client
        resp = client.get(f"{BOOKINGS_URL}upcoming/")
        assert resp.status_code == status.HTTP_200_OK
        results = get_results(resp)
        assert any(b['id'] == pending_booking.pk for b in results)

    def test_past_incluye_reservas_pasadas(self, auth_client, client_user, professional_user, service):
        start = timezone.now() - timedelta(days=3)
        b = Booking(client=client_user, professional=professional_user, service=service,
                    start_datetime=start, end_datetime=start + timedelta(minutes=60))
        b.save()
        client, _ = auth_client
        resp = client.get(f"{BOOKINGS_URL}past/")
        assert resp.status_code == status.HTTP_200_OK
        results = get_results(resp)
        assert len(results) >= 1


# ---------------------------------------------------------------------------
# Tests de estadísticas
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestBookingStats:
    """Tests del endpoint de estadísticas."""

    def test_admin_accede_a_stats(self, auth_admin, pending_booking):
        client, _ = auth_admin
        resp = client.get(f"{BOOKINGS_URL}stats/")
        assert resp.status_code == status.HTTP_200_OK
        assert 'total_bookings' in resp.data

    def test_cliente_no_accede_a_stats(self, auth_client):
        client, _ = auth_client
        resp = client.get(f"{BOOKINGS_URL}stats/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_stats_contiene_campos_esperados(self, auth_admin, pending_booking):
        client, _ = auth_admin
        resp = client.get(f"{BOOKINGS_URL}stats/")
        for campo in ['total_bookings', 'pending_bookings', 'confirmed_bookings',
                      'completed_bookings', 'canceled_bookings']:
            assert campo in resp.data

    def test_stats_days_invalido(self, auth_admin):
        client, _ = auth_admin
        resp = client.get(f"{BOOKINGS_URL}stats/", {'days': 'abc'})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_stats_days_fuera_de_rango(self, auth_admin):
        client, _ = auth_admin
        resp = client.get(f"{BOOKINGS_URL}stats/", {'days': 400})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Tests del ReviewViewSet
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestReviewViewSet:
    """Tests del ViewSet de reseñas."""

    def test_listado_publico_de_resenas(self, api_client, done_booking):
        Review.objects.create(booking=done_booking, rating=5, comment="Genial")
        resp = api_client.get(REVIEWS_URL)
        assert resp.status_code == status.HTTP_200_OK

    def test_solo_resenas_visibles_para_publico(self, api_client, done_booking):
        Review.objects.create(booking=done_booking, rating=4, is_visible=False)
        resp = api_client.get(REVIEWS_URL)
        results = get_results(resp)
        # Ninguna reseña invisible debe aparecer
        assert len(results) == 0

    def test_cliente_puede_crear_resena_para_done(self, auth_client, done_booking):
        client, _ = auth_client
        data = {'booking': done_booking.pk, 'rating': 5, 'comment': 'Muy bueno'}
        resp = client.post(REVIEWS_URL, data, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    def test_cliente_no_puede_resenar_pending(self, auth_client, pending_booking):
        client, _ = auth_client
        data = {'booking': pending_booking.pk, 'rating': 3}
        resp = client.post(REVIEWS_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_puede_borrar_resena(self, auth_admin, done_booking):
        review = Review.objects.create(booking=done_booking, rating=1, comment="Malo")
        client, _ = auth_admin
        resp = client.delete(review_detail_url(review.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_cliente_no_puede_borrar_resena(self, auth_client, done_booking):
        review = Review.objects.create(booking=done_booking, rating=5)
        client, _ = auth_client
        resp = client.delete(review_detail_url(review.pk))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_update_resena_no_permitido(self, auth_client, done_booking):
        review = Review.objects.create(booking=done_booking, rating=5)
        client, _ = auth_client
        resp = client.patch(review_detail_url(review.pk), {'rating': 3}, format='json')
        assert resp.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_filtro_por_professional(self, api_client, done_booking):
        Review.objects.create(booking=done_booking, rating=4)
        prof_id = done_booking.professional.pk
        resp = api_client.get(REVIEWS_URL, {'professional': prof_id})
        assert resp.status_code == status.HTTP_200_OK
