"""
Tests del modelo NotificationLog.

Cubre:
  - Creación y valores por defecto
  - Tipos de notificación (TextChoices)
  - Estados del log (TextChoices)
  - Representación en texto (__str__)
  - Relaciones con usuario y booking
"""

import pytest
from apps.notifications.models import NotificationLog


@pytest.mark.django_db
class TestNotificationLogCreation:
    """Tests de creación básica del log de notificaciones."""

    def test_log_se_crea_correctamente(self, client_user):
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            subject="Reserva creada",
            message="Tu reserva ha sido creada.",
        )
        assert log.pk is not None

    def test_status_por_defecto_pending(self, client_user):
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CONFIRMED,
            subject="Test",
            message="Test message",
        )
        assert log.status == NotificationLog.Status.PENDING

    def test_booking_puede_ser_null(self, client_user):
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_REMINDER,
            subject="Recordatorio",
            message="Recuerda tu cita.",
            booking=None,
        )
        assert log.booking is None

    def test_campos_de_auditoria_existen(self, client_user):
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CANCELED,
            subject="Cancelada",
            message="Tu cita ha sido cancelada.",
        )
        assert log.created_at is not None

    def test_log_con_booking_asociado(self, client_user, pending_booking):
        log = NotificationLog.objects.create(
            recipient=client_user,
            booking=pending_booking,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            subject="Reserva creada",
            message="Detalles de tu reserva.",
        )
        assert log.booking == pending_booking


@pytest.mark.django_db
class TestNotificationLogChoices:
    """Tests de los tipos y estados del log."""

    def test_tipos_disponibles(self):
        tipos = {t.value for t in NotificationLog.Type}
        assert 'BOOKING_CREATED' in tipos
        assert 'BOOKING_CONFIRMED' in tipos
        assert 'BOOKING_REJECTED' in tipos
        assert 'BOOKING_CANCELED' in tipos
        assert 'BOOKING_REMINDER' in tipos

    def test_estados_disponibles(self):
        estados = {s.value for s in NotificationLog.Status}
        assert 'PENDING' in estados
        assert 'SENT' in estados
        assert 'FAILED' in estados

    def test_log_con_estado_sent(self, client_user):
        from django.utils import timezone
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CONFIRMED,
            status=NotificationLog.Status.SENT,
            subject="Confirmada",
            message="Tu cita ha sido confirmada.",
            sent_at=timezone.now(),
        )
        assert log.status == NotificationLog.Status.SENT

    def test_log_con_estado_failed(self, client_user):
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_REJECTED,
            status=NotificationLog.Status.FAILED,
            subject="Rechazada",
            message="Tu cita ha sido rechazada.",
            error_message="SMTP error",
        )
        assert log.status == NotificationLog.Status.FAILED
        assert log.error_message == "SMTP error"


@pytest.mark.django_db
class TestNotificationLogStr:
    """Tests de la representación en texto."""

    def test_str_contiene_tipo_y_email(self, client_user):
        log = NotificationLog.objects.create(
            recipient=client_user,
            notification_type=NotificationLog.Type.BOOKING_CREATED,
            subject="Test",
            message="Test",
        )
        texto = str(log)
        assert client_user.email in texto
        assert log.status in texto


@pytest.mark.django_db
class TestNotificationLogOrdering:
    """Tests del orden por defecto."""

    def test_logs_ordenados_por_created_at_desc(self, client_user):
        for i in range(3):
            NotificationLog.objects.create(
                recipient=client_user,
                notification_type=NotificationLog.Type.BOOKING_REMINDER,
                subject=f"Test {i}",
                message=f"Message {i}",
            )
        logs = list(NotificationLog.objects.filter(recipient=client_user))
        for i in range(len(logs) - 1):
            assert logs[i].created_at >= logs[i + 1].created_at
