"""
Tests del ServiceViewSet.

Cubre:
  - GET  /api/services/        → listado público (solo activos para no-admin)
  - GET  /api/services/{id}/   → detalle público
  - POST /api/services/        → crear servicio (solo admin)
  - PATCH /api/services/{id}/  → actualizar servicio (solo admin)
  - DELETE /api/services/{id}/ → eliminar servicio (solo admin)
  - Filtros y búsqueda
"""

import pytest
from rest_framework import status

SERVICES_URL = "/api/services/"


def service_detail_url(pk):
    return f"/api/services/{pk}/"


def get_results(resp):
    """Extrae lista de resultados de respuesta paginada o simple."""
    if hasattr(resp.data, 'get') and 'results' in resp.data:
        return resp.data['results']
    return resp.data


@pytest.mark.django_db
class TestServicesListPublic:
    """Tests del endpoint de listado de servicios (acceso público)."""

    def test_listado_publico_sin_autenticar(self, api_client, service):
        resp = api_client.get(SERVICES_URL)
        assert resp.status_code == status.HTTP_200_OK

    def test_listado_incluye_servicio_activo(self, api_client, service):
        resp = api_client.get(SERVICES_URL)
        ids = [s['id'] for s in get_results(resp)]
        assert service.pk in ids

    def test_listado_no_incluye_servicio_inactivo(self, api_client, service, inactive_service):
        resp = api_client.get(SERVICES_URL)
        ids = [s['id'] for s in get_results(resp)]
        assert inactive_service.pk not in ids

    def test_listado_contiene_campos_basicos(self, api_client, service):
        resp = api_client.get(SERVICES_URL)
        results = get_results(resp)
        if results:
            item = results[0]
            for campo in ['id', 'name', 'description', 'duration_minutes']:
                assert campo in item

    def test_filtro_por_is_active_true(self, api_client, service, inactive_service):
        resp = api_client.get(SERVICES_URL, {'is_active': 'true'})
        assert resp.status_code == status.HTTP_200_OK
        ids = [s['id'] for s in get_results(resp)]
        assert service.pk in ids
        assert inactive_service.pk not in ids

    def test_busqueda_por_nombre(self, api_client, service):
        resp = api_client.get(SERVICES_URL, {'search': 'Fisioterapia'})
        assert resp.status_code == status.HTTP_200_OK
        ids = [s['id'] for s in get_results(resp)]
        assert service.pk in ids

    def test_busqueda_sin_coincidencia_devuelve_lista_vacia(self, api_client, service):
        resp = api_client.get(SERVICES_URL, {'search': 'xyzzy_no_existe'})
        assert resp.status_code == status.HTTP_200_OK
        assert get_results(resp) == []


@pytest.mark.django_db
class TestServiceDetailPublic:
    """Tests del endpoint de detalle de un servicio (acceso público)."""

    def test_detalle_servicio_activo(self, api_client, service):
        resp = api_client.get(service_detail_url(service.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['id'] == service.pk

    def test_id_inexistente_devuelve_404(self, api_client):
        resp = api_client.get(service_detail_url(99999))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_detalle_contiene_professionals_list(self, api_client, service):
        resp = api_client.get(service_detail_url(service.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert 'professionals_list' in resp.data


@pytest.mark.django_db
class TestServiceAdminOperations:
    """Tests de operaciones CRUD de administración."""

    VALID_SERVICE_DATA = {
        'name': 'Nuevo Servicio',
        'description': 'Descripcion del nuevo servicio',
        'duration_minutes': 45,
        'price': '50.00',
        'is_active': True,
    }

    def test_admin_puede_crear_servicio(self, auth_admin):
        client, _ = auth_admin
        resp = client.post(SERVICES_URL, self.VALID_SERVICE_DATA, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    def test_cliente_no_puede_crear_servicio(self, auth_client):
        client, _ = auth_client
        resp = client.post(SERVICES_URL, self.VALID_SERVICE_DATA, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_profesional_no_puede_crear_servicio(self, auth_professional):
        client, _ = auth_professional
        resp = client.post(SERVICES_URL, self.VALID_SERVICE_DATA, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_anonimo_no_puede_crear_servicio(self, api_client):
        resp = api_client.post(SERVICES_URL, self.VALID_SERVICE_DATA, format='json')
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_admin_puede_actualizar_servicio(self, auth_admin, service):
        client, _ = auth_admin
        resp = client.patch(service_detail_url(service.pk), {'name': 'Nombre Actualizado'}, format='json')
        assert resp.status_code == status.HTTP_200_OK

    def test_admin_puede_eliminar_servicio(self, auth_admin, service):
        client, _ = auth_admin
        resp = client.delete(service_detail_url(service.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_admin_ve_servicios_inactivos_en_listado(self, auth_admin, service, inactive_service):
        client, _ = auth_admin
        resp = client.get(SERVICES_URL)
        assert resp.status_code == status.HTTP_200_OK
        ids = [s['id'] for s in get_results(resp)]
        assert inactive_service.pk in ids

    def test_crear_servicio_nombre_invalido_falla(self, auth_admin):
        client, _ = auth_admin
        data = {**self.VALID_SERVICE_DATA, 'name': 'AB'}
        resp = client.post(SERVICES_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_crear_servicio_sin_nombre_falla(self, auth_admin):
        client, _ = auth_admin
        data = {k: v for k, v in self.VALID_SERVICE_DATA.items() if k != 'name'}
        resp = client.post(SERVICES_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_crear_servicio_sin_duracion_falla(self, auth_admin):
        client, _ = auth_admin
        data = {k: v for k, v in self.VALID_SERVICE_DATA.items() if k != 'duration_minutes'}
        resp = client.post(SERVICES_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
