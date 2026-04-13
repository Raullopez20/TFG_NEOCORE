"""
Tests de las vistas de notificaciones.

Cubre:
  - POST /api/contact/         → formulario de contacto
  - GET  /api/notifications/   → listado de logs (autenticado)
  - GET  /api/notifications/{id}/ → detalle de log
"""

import pytest
from unittest.mock import patch
from rest_framework import status

from apps.notifications.models import NotificationLog

CONTACT_URL = "/api/contact/"
NOTIFICATIONS_URL = "/api/notifications/"


def notif_detail_url(pk):
    return f"/api/notifications/{pk}/"


def get_results(resp):
    """Extrae lista de resultados de respuesta paginada o simple."""
    if hasattr(resp.data, 'get') and 'results' in resp.data:
        return resp.data['results']
    return resp.data


# ---------------------------------------------------------------------------
# Tests de ContactMessageView
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestContactMessageView:
    """Tests del endpoint de formulario de contacto."""

    VALID_CONTACT = {
        "name": "Carlos Lopez",
        "email": "carlos@example.com",
        "subject": "Consulta sobre servicios",
        "message": "Me gustaria saber mas sobre vuestros servicios.",
    }

    @patch('apps.notifications.views.send_mail')
    def test_mensaje_valido_devuelve_201(self, mock_mail, api_client):
        mock_mail.return_value = 1
        resp = api_client.post(CONTACT_URL, self.VALID_CONTACT, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    @patch('apps.notifications.views.send_mail')
    def test_mensaje_valido_llama_send_mail(self, mock_mail, api_client):
        mock_mail.return_value = 1
        api_client.post(CONTACT_URL, self.VALID_CONTACT, format='json')
        assert mock_mail.called

    def test_email_invalido_devuelve_400(self, api_client):
        data = {**self.VALID_CONTACT, "email": "noesunmail"}
        resp = api_client.post(CONTACT_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nombre_invalido_devuelve_400(self, api_client):
        data = {**self.VALID_CONTACT, "name": "12345"}
        resp = api_client.post(CONTACT_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nombre_vacio_devuelve_400(self, api_client):
        data = {**self.VALID_CONTACT, "name": ""}
        resp = api_client.post(CONTACT_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_mensaje_vacio_devuelve_400(self, api_client):
        data = {**self.VALID_CONTACT, "message": ""}
        resp = api_client.post(CONTACT_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_asunto_vacio_devuelve_400(self, api_client):
        data = {**self.VALID_CONTACT, "subject": ""}
        resp = api_client.post(CONTACT_URL, data, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch('apps.notifications.views.send_mail')
    def test_html_en_mensaje_es_sanitizado(self, mock_mail, api_client):
        mock_mail.return_value = 1
        data = {**self.VALID_CONTACT, "message": "<script>alert(1)</script>Hola"}
        resp = api_client.post(CONTACT_URL, data, format='json')
        assert resp.status_code == status.HTTP_201_CREATED
        call_kwargs = mock_mail.call_args
        assert '<script>' not in str(call_kwargs)

    def test_endpoint_publico_sin_autenticacion(self, api_client):
        resp = api_client.post(CONTACT_URL, {}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Tests de NotificationLogViewSet
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestNotificationLogViewSet:
    """Tests del ViewSet de historial de notificaciones."""

    def test_usuario_ve_solo_sus_notificaciones(self, auth_client, client_user, professional_user):
        NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            subject="Para el cliente",
            message="Notificacion del cliente",
        )
        NotificationLog.objects.create(
            recipient=professional_user,
            notification_type=NotificationLog.Type.BOOKING_CONFIRMED,
            subject="Para el profesional",
            message="Notificacion del profesional",
        )
        client, user = auth_client
        resp = client.get(NOTIFICATIONS_URL)
        assert resp.status_code == status.HTTP_200_OK
        results = get_results(resp)
        for notif in results:
            assert notif['recipient'] == user.pk

    def test_admin_ve_todas_las_notificaciones(self, auth_admin, client_user, professional_user):
        NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            subject="Test 1",
            message="Msg 1",
        )
        NotificationLog.objects.create(
            recipient=professional_user,
            notification_type=NotificationLog.Type.BOOKING_CONFIRMED,
            subject="Test 2",
            message="Msg 2",
        )
        client, _ = auth_admin
        resp = client.get(NOTIFICATIONS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(get_results(resp)) >= 2

    def test_anonimo_no_puede_listar(self, api_client):
        resp = api_client.get(NOTIFICATIONS_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_usuario_accede_a_detalle_de_su_notificacion(self, auth_client, client_user):
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            subject="Detalle test",
            message="Mensaje de prueba",
        )
        client, _ = auth_client
        resp = client.get(notif_detail_url(log.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['id'] == log.pk

    def test_usuario_no_accede_a_notificacion_ajena(self, auth_client, professional_user):
        log = NotificationLog.objects.create(
            recipient=professional_user,
            notification_type=NotificationLog.Type.BOOKING_CONFIRMED,
            subject="Ajena",
            message="No deberia verse",
        )
        client, _ = auth_client
        resp = client.get(notif_detail_url(log.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_filtro_por_status(self, auth_client, client_user):
        NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            status=NotificationLog.Status.SENT,
            subject="Enviada",
            message="Msg",
        )
        NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CANCELED,
            status=NotificationLog.Status.FAILED,
            subject="Fallida",
            message="Msg",
        )
        client, _ = auth_client
        resp = client.get(NOTIFICATIONS_URL, {'status': 'SENT'})
        assert resp.status_code == status.HTTP_200_OK
        for n in get_results(resp):
            assert n['status'] == 'SENT'

    def test_filtro_por_notification_type(self, auth_client, client_user):
        NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            subject="Creada",
            message="Msg",
        )
        client, _ = auth_client
        resp = client.get(NOTIFICATIONS_URL, {'notification_type': 'BOOKING_CREATED'})
        assert resp.status_code == status.HTTP_200_OK
        for n in get_results(resp):
            assert n['notification_type'] == 'BOOKING_CREATED'

    def test_no_se_puede_crear_notificacion_via_api(self, auth_client):
        client, _ = auth_client
        data = {
            'notification_type': 'BOOKING_CREATED',
            'subject': 'Test',
            'message': 'Test',
        }
        resp = client.post(NOTIFICATIONS_URL, data, format='json')
        assert resp.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_respuesta_contiene_campos_esperados(self, auth_client, client_user):
        NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_REMINDER,
            subject="Recordatorio",
            message="Tu cita es manana.",
        )
        client, _ = auth_client
        resp = client.get(NOTIFICATIONS_URL)
        assert resp.status_code == status.HTTP_200_OK
        results = get_results(resp)
        if results:
            item = results[0]
            for campo in ['id', 'recipient', 'notification_type', 'status', 'subject', 'created_at']:
                assert campo in item
