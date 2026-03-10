"""
Celery tasks for sending notifications.
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
    Send a notification email for a booking event.
    
    Args:
        booking_id: ID of the booking
        notification_type: Type of notification (created, confirmed, etc.)
        recipient: 'client' or 'professional'
    """
    try:
        booking = Booking.objects.select_related(
            'client', 'professional', 'service'
        ).get(id=booking_id)
    except Booking.DoesNotExist:
        return f"Booking {booking_id} not found"
    
    # Determine recipient
    if recipient == 'client':
        recipient_user = booking.client
    elif recipient == 'professional':
        recipient_user = booking.professional
    else:
        return f"Invalid recipient: {recipient}"
    
    # Build email content based on notification type
    subject, message = _get_notification_content(booking, notification_type, recipient)
    
    # Create notification log
    log = NotificationLog.objects.create(
        recipient=recipient_user,
        booking=booking,
        notification_type=notification_type.upper(),
        subject=subject,
        message=message,
    )
    
    # Send email
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_user.email],
            fail_silently=False,
        )
        
        log.status = NotificationLog.Status.SENT
        log.sent_at = timezone.now()
        log.save()
        
        return f"Email sent to {recipient_user.email}"
        
    except Exception as e:
        log.status = NotificationLog.Status.FAILED
        log.error_message = str(e)
        log.save()
        
        return f"Failed to send email: {str(e)}"


@shared_task
def send_booking_reminders():
    """
    Send reminder emails for upcoming bookings (24 hours before).
    Runs hourly via Celery Beat.
    """
    # Get bookings starting in ~24 hours that haven't been reminded
    now = timezone.now()
    reminder_window_start = now + timedelta(hours=23)
    reminder_window_end = now + timedelta(hours=25)
    
    bookings = Booking.objects.filter(
        start_datetime__gte=reminder_window_start,
        start_datetime__lte=reminder_window_end,
        status=Booking.Status.CONFIRMED,
        reminder_sent=False,
    ).select_related('client', 'professional', 'service')
    
    sent_count = 0
    
    for booking in bookings:
        # Send reminder to client
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
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.client.email],
                fail_silently=False,
            )
            
            # Log the notification
            NotificationLog.objects.create(
                recipient=booking.client,
                booking=booking,
                notification_type=NotificationLog.Type.BOOKING_REMINDER,
                status=NotificationLog.Status.SENT,
                subject=subject,
                message=message,
                sent_at=timezone.now(),
            )
            
            # Mark reminder as sent
            booking.reminder_sent = True
            booking.reminder_sent_at = timezone.now()
            booking.save(update_fields=['reminder_sent', 'reminder_sent_at'])
            
            sent_count += 1
            
        except Exception as e:
            # Log failure
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
    Clean up old notification logs (older than 90 days).
    Runs daily via Celery Beat.
    """
    cutoff_date = timezone.now() - timedelta(days=90)
    deleted_count, _ = NotificationLog.objects.filter(
        created_at__lt=cutoff_date
    ).delete()
    
    return f"Deleted {deleted_count} old notification log(s)"


def _get_notification_content(booking, notification_type, recipient):
    """
    Generate email subject and message based on notification type.
    """
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
    
    elif notification_type == 'booking_canceled':
        if recipient == 'client':
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
        else:  # professional
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
    else:
        subject = f"Notificación de reserva - {booking.service.name}"
        message = "Se ha actualizado el estado de tu reserva."
    
    return subject, message
