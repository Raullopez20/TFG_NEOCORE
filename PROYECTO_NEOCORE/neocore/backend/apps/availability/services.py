"""
Lógica de negocio para la generación de slots de disponibilidad.

Contiene la clase AvailabilityService que centraliza toda la lógica
de cálculo de horarios disponibles para los profesionales. Es el
componente más crítico del sistema de reservas, ya que determina
qué slots pueden ofrecerse a los clientes.

Proceso de generación de slots:
    1. Obtener las reglas de disponibilidad semanal del profesional.
    2. Para cada día del rango solicitado:
        a. Verificar si el día cae en un período de ausencia (TimeOff).
        b. Obtener las reglas activas para ese día de la semana.
        c. Generar slots de la duración del servicio dentro de cada regla.
        d. Excluir slots que se solapen con reservas existentes (PENDING/CONFIRMED).
        e. Excluir slots que ya hayan pasado (anteriores a la hora actual).
    3. Devolver la lista de slots disponibles con sus horarios.

Validación de slots:
    Antes de crear una reserva, validate_slot_available() verifica que
    el slot solicitado cumple todas las restricciones: está dentro de las
    reglas, no hay ausencias, y no hay reservas solapadas.
"""

from datetime import datetime, date, time, timedelta
from typing import List, Dict, Optional
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import AvailabilityRule, TimeOff

User = get_user_model()


class AvailabilityService:
    """
    Servicio para la generación y validación de slots de disponibilidad.

    Métodos estáticos que pueden invocarse sin instanciar la clase:
        - get_available_slots(): Genera todos los slots disponibles para un rango.
        - validate_slot_available(): Valida si un slot específico está libre.

    Atributos de clase:
        - SLOT_BUFFER_MINUTES: Minutos de margen entre citas consecutivas.
          Actualmente en 0, pero puede ajustarse para dar descansos entre citas.
    """
    
    # Minutos de margen entre citas consecutivas (0 = sin margen)
    SLOT_BUFFER_MINUTES = 0
    
    @staticmethod
    def get_available_slots(
        professional_id: int,
        service_duration: int,
        start_date: date,
        end_date: date
    ) -> List[Dict]:
        """
        Genera los slots de tiempo disponibles para un profesional y servicio.

        Recorre cada día del rango [start_date, end_date] y, para cada regla
        de disponibilidad activa de ese día, genera slots consecutivos de la
        duración indicada, excluyendo los que se solapen con reservas existentes
        o que ya hayan pasado.

        Args:
            professional_id: ID del profesional.
            service_duration: Duración del servicio en minutos.
            start_date: Fecha de inicio del rango a consultar.
            end_date: Fecha de fin del rango a consultar.

        Returns:
            Lista de diccionarios con 'start_datetime', 'end_datetime' y 'is_available'.
            Retorna lista vacía si el profesional no existe o no tiene reglas.
        """
        # Importación diferida para evitar dependencia circular con bookings
        from apps.bookings.models import Booking
        
        try:
            professional = User.objects.get(
                id=professional_id,
                role=User.Role.PROFESSIONAL,
                is_active=True
            )
        except User.DoesNotExist:
            return []
        
        # Obtener las reglas de disponibilidad activas del profesional
        rules = AvailabilityRule.objects.filter(
            professional=professional,
            is_active=True
        )
        
        if not rules.exists():
            return []
        
        # Obtener los períodos de ausencia que se solapen con el rango solicitado
        time_offs = TimeOff.objects.filter(
            professional=professional,
            end_date__gte=start_date,
            start_date__lte=end_date
        )
        
        # Obtener las reservas activas (PENDING o CONFIRMED) del profesional en el rango
        bookings = Booking.objects.filter(
            professional=professional,
            start_datetime__date__gte=start_date,
            start_datetime__date__lte=end_date,
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED]
        ).values_list('start_datetime', 'end_datetime')
        
        # Convertir las reservas a un set de tuplas (inicio, fin) con buffer aplicado
        booked_slots = set()
        for start_dt, end_dt in bookings:
            booked_slots.add((
                start_dt - timedelta(minutes=AvailabilityService.SLOT_BUFFER_MINUTES),
                end_dt + timedelta(minutes=AvailabilityService.SLOT_BUFFER_MINUTES)
            ))
        
        # Generar slots día por día
        slots = []
        current_date = start_date
        
        while current_date <= end_date:
            # Omitir días que caen dentro de un período de ausencia
            if AvailabilityService._is_date_time_off(current_date, time_offs):
                current_date += timedelta(days=1)
                continue
            
            # Obtener las reglas aplicables al día de la semana actual
            day_of_week = current_date.weekday()
            day_rules = rules.filter(day_of_week=day_of_week)
            
            for rule in day_rules:
                # Generar los slots para esta regla específica
                slots.extend(
                    AvailabilityService._generate_slots_for_rule(
                        current_date,
                        rule,
                        service_duration,
                        booked_slots
                    )
                )
            
            current_date += timedelta(days=1)
        
        return slots
    
    @staticmethod
    def _is_date_time_off(check_date: date, time_offs) -> bool:
        """
        Comprueba si una fecha cae dentro de algún período de ausencia.

        Args:
            check_date: Fecha a verificar.
            time_offs: QuerySet de períodos de ausencia.

        Returns:
            True si la fecha está dentro de algún período de ausencia.
        """
        for time_off in time_offs:
            if time_off.start_date <= check_date <= time_off.end_date:
                return True
        return False
    
    @staticmethod
    def _generate_slots_for_rule(
        current_date: date,
        rule: AvailabilityRule,
        duration: int,
        booked_slots: set
    ) -> List[Dict]:
        """
        Genera los slots disponibles para una regla específica en una fecha.

        Parte de la hora de inicio de la regla y avanza en incrementos
        iguales a la duración del servicio hasta llegar a la hora de fin.
        Excluye automáticamente:
            - Slots que ya hayan pasado (anteriores a la hora actual).
            - Slots que se solapen con reservas existentes.

        Args:
            current_date: Fecha para la que se generan los slots.
            rule: Regla de disponibilidad (día + horario).
            duration: Duración del servicio en minutos.
            booked_slots: Set de tuplas (inicio, fin) de reservas existentes.

        Returns:
            Lista de diccionarios con los slots disponibles.
        """
        slots = []
        
        # Combinar la fecha actual con las horas de la regla
        current_time = datetime.combine(current_date, rule.start_time)
        end_time = datetime.combine(current_date, rule.end_time)
        
        # Convertir a datetime con zona horaria (timezone-aware)
        current_time = timezone.make_aware(current_time)
        end_time = timezone.make_aware(end_time)
        
        # Saltar slots pasados: avanzar al siguiente slot válido
        now = timezone.now()
        if current_time < now:
            minutes_diff = (now - current_time).total_seconds() / 60
            slots_passed = int(minutes_diff // duration) + 1
            current_time += timedelta(minutes=duration * slots_passed)
        
        # Iterar generando slots consecutivos de la duración indicada
        while current_time + timedelta(minutes=duration) <= end_time:
            slot_end = current_time + timedelta(minutes=duration)
            
            # Verificar que no se solape con ninguna reserva existente
            is_available = not AvailabilityService._slot_overlaps(
                current_time,
                slot_end,
                booked_slots
            )
            
            if is_available:
                slots.append({
                    'start_datetime': current_time,
                    'end_datetime': slot_end,
                    'is_available': True
                })
            
            # Avanzar al siguiente slot (duración + buffer entre citas)
            current_time = slot_end + timedelta(minutes=AvailabilityService.SLOT_BUFFER_MINUTES)
        
        return slots
    
    @staticmethod
    def _slot_overlaps(start: datetime, end: datetime, booked_slots: set) -> bool:
        """
        Comprueba si un slot se solapa con alguna reserva existente.

        Dos intervalos se solapan cuando el inicio de uno es anterior
        al fin del otro y viceversa (condición de solapamiento estándar).

        Args:
            start: Inicio del slot a verificar.
            end: Fin del slot a verificar.
            booked_slots: Set de tuplas (inicio, fin) de reservas.

        Returns:
            True si hay solapamiento con al menos una reserva.
        """
        for booked_start, booked_end in booked_slots:
            if start < booked_end and end > booked_start:
                return True
        return False
    
    @staticmethod
    def validate_slot_available(
        professional_id: int,
        start_datetime: datetime,
        end_datetime: datetime,
        exclude_booking_id: Optional[int] = None
    ) -> tuple[bool, str]:
        """
        Valida si un slot de tiempo específico está disponible para reserva.

        Realiza una serie de comprobaciones secuenciales:
            1. Que el profesional exista y esté activo.
            2. Que el slot no sea en el pasado.
            3. Que el slot esté dentro de una regla de disponibilidad activa.
            4. Que la fecha no caiga en un período de ausencia.
            5. Que no haya reservas existentes que se solapen.

        Args:
            professional_id: ID del profesional.
            start_datetime: Inicio del slot solicitado.
            end_datetime: Fin del slot solicitado.
            exclude_booking_id: ID de reserva a excluir (para actualizaciones).

        Returns:
            Tupla (es_válido, mensaje_error). Si es_válido es True,
            mensaje_error es cadena vacía.
        """
        # Importación diferida para evitar dependencia circular
        from apps.bookings.models import Booking
        
        # 1. Verificar que el profesional existe y está activo
        try:
            professional = User.objects.get(
                id=professional_id,
                role=User.Role.PROFESSIONAL,
                is_active=True
            )
        except User.DoesNotExist:
            return False, "Professional not found"
        
        # 2. Verificar que el slot no sea en el pasado
        if start_datetime < timezone.now():
            return False, "Cannot book slots in the past"
        
        # 3. Verificar que el slot esté dentro de una regla de disponibilidad
        day_of_week = start_datetime.weekday()
        start_time = start_datetime.time()
        end_time = end_datetime.time()
        
        rules = AvailabilityRule.objects.filter(
            professional=professional,
            day_of_week=day_of_week,
            is_active=True,
            start_time__lte=start_time,
            end_time__gte=end_time
        )
        
        if not rules.exists():
            return False, "Slot not within professional's availability"
        
        # 4. Verificar que la fecha no esté en un período de ausencia
        time_offs = TimeOff.objects.filter(
            professional=professional,
            start_date__lte=start_datetime.date(),
            end_date__gte=start_datetime.date()
        )
        
        if time_offs.exists():
            return False, "Professional is not available on this date"
        
        # 5. Verificar que no haya reservas solapadas
        overlapping = Booking.objects.filter(
            professional=professional,
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
            start_datetime__lt=end_datetime,
            end_datetime__gt=start_datetime
        )
        
        # Excluir la reserva actual en caso de actualización
        if exclude_booking_id:
            overlapping = overlapping.exclude(id=exclude_booking_id)
        
        if overlapping.exists():
            return False, "Slot is already booked"
        
        return True, ""
