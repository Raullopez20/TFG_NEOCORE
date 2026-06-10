"""
Tareas asíncronas de Celery para el envío de notificaciones por email.

Define tres tareas principales que se ejecutan en segundo plano:

    1. send_booking_notification (invocada por señales):
       Envía un email al destinatario correspondiente cuando se
       crea, confirma, rechaza o cancela una reserva.

    2. send_booking_reminders (ejecutada cada hora por Celery Beat):
       Envía recordatorios automáticos a los clientes 24 horas
       antes de sus citas confirmadas.

    3. cleanup_old_notifications (ejecutada diariamente por Celery Beat):
       Elimina registros de notificaciones con más de 90 días
       para mantener limpia la base de datos.

Función auxiliar:
    _get_notification_content(): Genera el asunto y cuerpo del email
    según el tipo de notificación y destinatario.

Todos los emails se envían en español y registran su resultado
en la tabla NotificationLog para auditoría.
"""

from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from celery import shared_task

from .models import NotificationLog
from apps.bookings.models import Booking


@shared_task
def send_booking_notification(booking_id, notification_type, recipient):
    """
    Envía un email de notificación para un evento de reserva.

    Se invoca de forma asíncrona (.delay()) desde las señales de
    bookings cuando se detecta un cambio de estado relevante.

    Flujo:
        1. Obtiene la reserva con sus relaciones (client, professional, service).
        2. Determina el destinatario (cliente o profesional).
        3. Genera el contenido del email según el tipo de evento.
        4. Crea un registro en NotificationLog con estado PENDING.
        5. Intenta enviar el email:
           - Éxito: actualiza el log a SENT con la fecha de envío.
           - Fallo: actualiza el log a FAILED con el mensaje de error.

    Args:
        booking_id: ID de la reserva asociada al evento.
        notification_type: Tipo de evento ('booking_created', 'booking_confirmed',
                          'booking_rejected', 'booking_canceled').
        recipient: A quién enviar: 'client' o 'professional'.

    Returns:
        Cadena descriptiva del resultado del envío.
    """
    try:
        booking = Booking.objects.select_related(
            'client', 'professional', 'service'
        ).get(id=booking_id)
    except Booking.DoesNotExist:
        return f"Booking {booking_id} not found"
    
    # Determinar el usuario destinatario según el parámetro
    if recipient == 'client':
        recipient_user = booking.client
    elif recipient == 'professional':
        recipient_user = booking.professional
    else:
        return f"Invalid recipient: {recipient}"
    
    # Generar el asunto y cuerpo del email según el tipo de notificación
    subject, message = _get_notification_content(booking, notification_type, recipient)
    
    # Crear el registro de notificación con estado inicial PENDING
    log = NotificationLog.objects.create(
        recipient=recipient_user,
        booking=booking,
        notification_type=notification_type.upper(),
        subject=subject,
        message=message,
    )
    
    # Intentar enviar el email
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_user.email],
            fail_silently=False,
        )
        
        # Envío exitoso: actualizar el log
        log.status = NotificationLog.Status.SENT
        log.sent_at = timezone.now()
        log.save()
        
        return f"Email sent to {recipient_user.email}"
        
    except Exception as e:
        # Envío fallido: registrar el error
        log.status = NotificationLog.Status.FAILED
        log.error_message = str(e)
        log.save()
        
        return f"Failed to send email: {str(e)}"


@shared_task
def send_booking_reminders():
    """
    Envía recordatorios por email para citas próximas (24 horas antes).

    Se ejecuta cada hora mediante Celery Beat (configurado en settings.py).

    Flujo:
        1. Busca reservas CONFIRMED con inicio entre 23 y 25 horas desde ahora
           que aún no hayan recibido recordatorio (reminder_sent=False).
        2. Para cada reserva encontrada:
           a. Compone un email de recordatorio personalizado.
           b. Envía el email al cliente.
           c. Registra el resultado en NotificationLog.
           d. Marca la reserva como recordada (reminder_sent=True).

    Returns:
        Cadena con el número de recordatorios enviados.
    """
    # Ventana de búsqueda: citas que empiezan entre 23h y 25h desde ahora
    # (margen de ±1h para cubrir la frecuencia de ejecución horaria)
    now = timezone.now()
    reminder_window_start = now + timedelta(hours=23)
    reminder_window_end = now + timedelta(hours=25)
    
    # Buscar reservas confirmadas que necesitan recordatorio
    bookings = Booking.objects.filter(
        start_datetime__gte=reminder_window_start,
        start_datetime__lte=reminder_window_end,
        status=Booking.Status.CONFIRMED,
        reminder_sent=False,
    ).select_related('client', 'professional', 'service')
    
    sent_count = 0
    
    for booking in bookings:
        # Componer el email de recordatorio para el cliente
        subject = f"Recordatorio: Cita mañana con {booking.professional.get_full_name()}"
        message = f"""
Hola {booking.client.first_name},

Te recordamos tu cita programada para mañana:

Servicio: {booking.service.name}
Profesional: {booking.professional.get_full_name()}
Fecha y hora: {booking.start_datetime.strftime('%d/%m/%Y a las %H:%M')}
Duración: {booking.duration_minutes} minutos

{f'Notas: {booking.client_notes}' if booking.client_notes else ''}

Si necesitas cancelar o reprogramar, por favor contacta con nosotros lo antes posible.

Saludos,
El equipo de NeoCore
        """.strip()
        
        try:
            # Enviar el email de recordatorio
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.client.email],
                fail_silently=False,
            )
            
            # Registrar el envío exitoso en el log de notificaciones
            NotificationLog.objects.create(
                recipient=booking.client,
                booking=booking,
                notification_type=NotificationLog.Type.BOOKING_REMINDER,
                status=NotificationLog.Status.SENT,
                subject=subject,
                message=message,
                sent_at=timezone.now(),
            )
            
            # Marcar la reserva como recordada para no enviar duplicados
            booking.reminder_sent = True
            booking.reminder_sent_at = timezone.now()
            booking.save(update_fields=['reminder_sent', 'reminder_sent_at'])
            
            sent_count += 1
            
        except Exception as e:
            # Registrar el fallo en el log de notificaciones
            NotificationLog.objects.create(
                recipient=booking.client,
                booking=booking,
                notification_type=NotificationLog.Type.BOOKING_REMINDER,
                status=NotificationLog.Status.FAILED,
                subject=subject,
                message=message,
                error_message=str(e),
            )
    
    return f"Sent {sent_count} reminder(s)"


@shared_task
def cleanup_old_notifications():
    """
    Limpia registros antiguos del log de notificaciones (más de 90 días).

    Se ejecuta diariamente mediante Celery Beat para mantener
    la tabla NotificationLog con un tamaño controlado y evitar
    acumulación innecesaria de datos históricos.

    Returns:
        Cadena con el número de registros eliminados.
    """
    cutoff_date = timezone.now() - timedelta(days=90)
    deleted_count, _ = NotificationLog.objects.filter(
        created_at__lt=cutoff_date
    ).delete()
    
    return f"Deleted {deleted_count} old notification log(s)"


def _get_notification_content(booking, notification_type, recipient):
    """
    Genera el asunto y cuerpo del email según el tipo de notificación.

    Función auxiliar que centraliza la lógica de composición de emails
    para mantener las plantillas de mensajes organizadas. Todos los
    mensajes están en español y se personalizan con los datos de la reserva.

    Args:
        booking: Instancia de Booking con relaciones cargadas.
        notification_type: Tipo de evento ('booking_created', etc.).
        recipient: Destinatario ('client' o 'professional').

    Returns:
        Tupla (asunto, mensaje) con el contenido del email.
    """
    # =========================================================================
    # Nueva reserva creada -> notificar al profesional
    # =========================================================================
    if notification_type == 'booking_created' and recipient == 'professional':
        subject = f"Nueva solicitud de reserva - {booking.service.name}"
        message = f"""
Hola {booking.professional.first_name},

Tienes una nueva solicitud de reserva:

Cliente: {booking.client.get_full_name()}
Servicio: {booking.service.name}
Fecha y hora solicitada: {booking.start_datetime.strftime('%d/%m/%Y a las %H:%M')}
Duración: {booking.duration_minutes} minutos

{f'Notas del cliente: {booking.client_notes}' if booking.client_notes else ''}

Por favor, revisa y confirma o rechaza esta reserva desde tu panel de control.

Saludos,
El equipo de NeoCore
        """.strip()
    
    # =========================================================================
    # Reserva confirmada -> notificar al cliente
    # =========================================================================
    elif notification_type == 'booking_confirmed' and recipient == 'client':
        subject = f"Reserva confirmada - {booking.service.name}"
        message = f"""
Hola {booking.client.first_name},

¡Tu reserva ha sido confirmada!

Servicio: {booking.service.name}
Profesional: {booking.professional.get_full_name()}
Fecha y hora: {booking.start_datetime.strftime('%d/%m/%Y a las %H:%M')}
Duración: {booking.duration_minutes} minutos

Recibirás un recordatorio 24 horas antes de tu cita.

Saludos,
El equipo de NeoCore
        """.strip()
    
    # =========================================================================
    # Reserva rechazada -> notificar al cliente
    # =========================================================================
    elif notification_type == 'booking_rejected' and recipient == 'client':
        subject = f"Reserva rechazada - {booking.service.name}"
        message = f"""
Hola {booking.client.first_name},

Lamentamos informarte que tu solicitud de reserva no ha podido ser aceptada.

Servicio: {booking.service.name}
Profesional: {booking.professional.get_full_name()}
Fecha y hora solicitada: {booking.start_datetime.strftime('%d/%m/%Y a las %H:%M')}

{f'Motivo: {booking.cancellation_reason}' if booking.cancellation_reason else ''}

Por favor, intenta reservar en otro horario disponible.

Saludos,
El equipo de NeoCore
        """.strip()
    
    # =========================================================================
    # Reserva cancelada -> notificar a la parte contraria
    # =========================================================================
    elif notification_type == 'booking_canceled':
        if recipient == 'client':
            # Cancelada por el profesional -> notificar al cliente
            subject = f"Reserva cancelada - {booking.service.name}"
            message = f"""
Hola {booking.client.first_name},

Tu reserva ha sido cancelada.

Servicio: {booking.service.name}
Profesional: {booking.professional.get_full_name()}
Fecha y hora: {booking.start_datetime.strftime('%d/%m/%Y a las %H:%M')}

{f'Motivo: {booking.cancellation_reason}' if booking.cancellation_reason else ''}

Puedes realizar una nueva reserva cuando lo desees.

Saludos,
El equipo de NeoCore
            """.strip()
        else:
            # Cancelada por el cliente -> notificar al profesional
            subject = f"Reserva cancelada por el cliente - {booking.service.name}"
            message = f"""
Hola {booking.professional.first_name},

El cliente ha cancelado la siguiente reserva:

Cliente: {booking.client.get_full_name()}
Servicio: {booking.service.name}
Fecha y hora: {booking.start_datetime.strftime('%d/%m/%Y a las %H:%M')}

{f'Motivo: {booking.cancellation_reason}' if booking.cancellation_reason else ''}

Saludos,
El equipo de NeoCore
            """.strip()
    
    # =========================================================================
    # Tipo desconocido -> mensaje genérico de respaldo
    # =========================================================================
    else:
        subject = f"Notificación de reserva - {booking.service.name}"
        message = "Se ha actualizado el estado de tu reserva."
    
    return subject, message
