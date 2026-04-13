"""
Tests de los ViewSets de disponibilidad.

Cubre:
  - AvailabilityRuleViewSet: CRUD filtrado por rol
  - TimeOffViewSet: CRUD filtrado por rol
  - AvailabilitySlotViewSet: consulta pública de slots
"""

import pytest
from datetime import date, time, timedelta
from django.utils import timezone
from rest_framework import status

from apps.availability.models import AvailabilityRule, TimeOff

RULES_URL = "/api/availability/rules/"
TIMEOFF_URL = "/api/availability/time-off/"
SLOTS_URL = "/api/availability/slots/get_slots/"


def rule_detail_url(pk):
    return f"/api/availability/rules/{pk}/"


def timeoff_detail_url(pk):
    return f"/api/availability/time-off/{pk}/"


def get_results(resp):
    """Extrae la lista de resultados de una respuesta paginada o no paginada."""
    if hasattr(resp.data, 'get'):
        return resp.data.get('results', resp.data)
    return resp.data


# ---------------------------------------------------------------------------
# Fixtures locales
# ---------------------------------------------------------------------------
@pytest.fixture
def rule(professional_user):
    return AvailabilityRule.objects.create(
        professional=professional_user,
        day_of_week=0,
        start_time=time(9, 0),
        end_time=time(17, 0),
    )


@pytest.fixture
def time_off(professional_user):
    return TimeOff.objects.create(
        professional=professional_user,
        start_date=date(2030, 8, 1),
        end_date=date(2030, 8, 10),
        reason="Vacaciones",
    )


# ---------------------------------------------------------------------------
# Tests de AvailabilityRuleViewSet
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestAvailabilityRuleViewSet:
    """Tests del ViewSet de reglas de disponibilidad."""

    def test_profesional_lista_sus_reglas(self, auth_professional, rule):
        client, _ = auth_professional
        resp = client.get(RULES_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(get_results(resp)) >= 1

    def test_profesional_no_ve_reglas_de_otro(self, auth_professional, create_user):
        client, professional_user = auth_professional
        otro_prof = create_user(email="otro@prof.com", role="PROFESSIONAL")
        AvailabilityRule.objects.create(
            professional=otro_prof,
            day_of_week=2,
            start_time=time(10, 0),
            end_time=time(16, 0),
        )
        resp = client.get(RULES_URL)
        assert resp.status_code == status.HTTP_200_OK
        results = get_results(resp)
        profs = [r['professional'] for r in results]
        assert all(p == professional_user.pk for p in profs)

    def test_admin_ve_todas_las_reglas(self, auth_admin, rule, create_user):
        otro_prof = create_user(email="otro2@prof.com", role="PROFESSIONAL")
        AvailabilityRule.objects.create(
            professional=otro_prof,
            day_of_week=1,
            start_time=time(8, 0),
            end_time=time(12, 0),
        )
        client, _ = auth_admin
        resp = client.get(RULES_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(get_results(resp)) >= 2

    def test_cliente_no_ve_reglas(self, auth_client):
        client, _ = auth_client
        resp = client.get(RULES_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert get_results(resp) == []

    def test_anonimo_no_puede_listar(self, api_client):
        resp = api_client.get(RULES_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_profesional_puede_crear_regla(self, auth_professional):
        client, professional_user = auth_professional
        data = {
            'professional': professional_user.pk,
            'day_of_week': 3,
            'start_time': '10:00:00',
            'end_time': '18:00:00',
        }
        resp = client.post(RULES_URL, data, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    def test_cliente_no_puede_crear_regla(self, auth_client, professional_user):
        client, _ = auth_client
        data = {
            'professional': professional_user.pk,
            'day_of_week': 1,
            'start_time': '09:00:00',
            'end_time': '17:00:00',
        }
        resp = client.post(RULES_URL, data, format='json')
        # El cliente puede intentar crear pero la validación del modelo fallará
        # porque un cliente no es profesional
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_end_time_antes_de_start_falla(self, auth_professional):
        client, professional_user = auth_professional
        data = {
            'professional': professional_user.pk,
            'day_of_week': 0,
            'start_time': '17:00:00',
            'end_time': '09:00:00',
        }
        resp = client.post(RULES_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_profesional_puede_borrar_su_regla(self, auth_professional, rule):
        client, _ = auth_professional
        resp = client.delete(rule_detail_url(rule.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_regla_contiene_campos_esperados(self, auth_professional, rule):
        client, _ = auth_professional
        resp = client.get(rule_detail_url(rule.pk))
        assert resp.status_code == status.HTTP_200_OK
        for campo in ['id', 'professional', 'day_of_week', 'start_time', 'end_time', 'is_active']:
            assert campo in resp.data


# ---------------------------------------------------------------------------
# Tests de TimeOffViewSet
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestTimeOffViewSet:
    """Tests del ViewSet de períodos de ausencia."""

    def test_profesional_lista_sus_ausencias(self, auth_professional, time_off):
        client, _ = auth_professional
        resp = client.get(TIMEOFF_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(get_results(resp)) >= 1

    def test_profesional_puede_crear_ausencia(self, auth_professional):
        client, professional_user = auth_professional
        data = {
            'professional': professional_user.pk,
            'start_date': '2030-09-01',
            'end_date': '2030-09-05',
            'reason': 'Congreso medico',
        }
        resp = client.post(TIMEOFF_URL, data, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    def test_end_antes_de_start_falla(self, auth_professional):
        client, professional_user = auth_professional
        data = {
            'professional': professional_user.pk,
            'start_date': '2030-09-10',
            'end_date': '2030-09-01',
        }
        resp = client.post(TIMEOFF_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_ve_todas_las_ausencias(self, auth_admin, time_off):
        client, _ = auth_admin
        resp = client.get(TIMEOFF_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(get_results(resp)) >= 1

    def test_anonimo_no_puede_listar(self, api_client):
        resp = api_client.get(TIMEOFF_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_profesional_puede_borrar_su_ausencia(self, auth_professional, time_off):
        client, _ = auth_professional
        resp = client.delete(timeoff_detail_url(time_off.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT


# ---------------------------------------------------------------------------
# Tests de AvailabilitySlotViewSet
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestAvailabilitySlotViewSet:
    """Tests del endpoint público de consulta de slots."""

    def test_sin_parametros_devuelve_400(self, api_client):
        resp = api_client.get(SLOTS_URL)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_sin_service_duration_devuelve_400(self, api_client, professional_user):
        resp = api_client.get(SLOTS_URL, {'professional_id': professional_user.pk})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_sin_professional_id_devuelve_400(self, api_client):
        resp = api_client.get(SLOTS_URL, {'service_duration': 60})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_parametros_invalidos_devuelven_400(self, api_client, professional_user):
        resp = api_client.get(SLOTS_URL, {
            'professional_id': 'abc',
            'service_duration': 'xyz',
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_duracion_fuera_de_rango_devuelve_400(self, api_client, professional_user):
        resp = api_client.get(SLOTS_URL, {
            'professional_id': professional_user.pk,
            'service_duration': 5,  # < 15 min
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_professional_id_negativo_devuelve_400(self, api_client):
        resp = api_client.get(SLOTS_URL, {
            'professional_id': -1,
            'service_duration': 60,
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_profesional_sin_reglas_devuelve_slots_vacios(self, api_client, professional_user):
        start = (timezone.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        end = (timezone.now() + timedelta(days=14)).strftime('%Y-%m-%d')
        resp = api_client.get(SLOTS_URL, {
            'professional_id': professional_user.pk,
            'service_duration': 60,
            'start_date': start,
            'end_date': end,
        })
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['slots'] == []

    def test_endpoint_es_publico(self, api_client, professional_user):
        resp = api_client.get(SLOTS_URL, {
            'professional_id': professional_user.pk,
            'service_duration': 60,
        })
        assert resp.status_code == status.HTTP_200_OK

    def test_rango_mayor_31_dias_devuelve_400(self, api_client, professional_user):
        start = (timezone.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        end = (timezone.now() + timedelta(days=35)).strftime('%Y-%m-%d')
        resp = api_client.get(SLOTS_URL, {
            'professional_id': professional_user.pk,
            'service_duration': 60,
            'start_date': start,
            'end_date': end,
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_end_date_antes_de_start_devuelve_400(self, api_client, professional_user):
        resp = api_client.get(SLOTS_URL, {
            'professional_id': professional_user.pk,
            'service_duration': 60,
            'start_date': '2030-09-10',
            'end_date': '2030-09-01',
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_respuesta_contiene_metadatos(self, api_client, professional_user):
        resp = api_client.get(SLOTS_URL, {
            'professional_id': professional_user.pk,
            'service_duration': 60,
        })
        assert resp.status_code == status.HTTP_200_OK
        assert 'professional_id' in resp.data
        assert 'service_duration' in resp.data
        assert 'slots' in resp.data

    def test_con_regla_genera_slots(self, api_client, professional_user):
        target = timezone.now() + timedelta(days=8)
        day = target.weekday()
        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        start_str = target.strftime('%Y-%m-%d')
        resp = api_client.get(SLOTS_URL, {
            'professional_id': professional_user.pk,
            'service_duration': 60,
            'start_date': start_str,
            'end_date': start_str,
        })
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['slots']) > 0
