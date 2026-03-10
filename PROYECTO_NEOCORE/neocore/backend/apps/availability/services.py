"""
Business logic for availability slot generation.
"""

from datetime import datetime, date, time, timedelta
from typing import List, Dict, Optional
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import AvailabilityRule, TimeOff

User = get_user_model()


class AvailabilityService:
    """Service for generating available time slots."""
    
    SLOT_BUFFER_MINUTES = 0  # Buffer between appointments
    
    @staticmethod
    def get_available_slots(
        professional_id: int,
        service_duration: int,
        start_date: date,
        end_date: date
    ) -> List[Dict]:
        """
        Generate available time slots for a professional and service.
        
        Args:
            professional_id: ID of the professional
            service_duration: Duration of the service in minutes
            start_date: Start date for slot generation
            end_date: End date for slot generation
        
        Returns:
            List of available slots with start and end datetime
        """
        from apps.bookings.models import Booking
        
        try:
            professional = User.objects.get(
                id=professional_id,
                role=User.Role.PROFESSIONAL,
                is_active=True
            )
        except User.DoesNotExist:
            return []
        
        # Get availability rules for the professional
        rules = AvailabilityRule.objects.filter(
            professional=professional,
            is_active=True
        )
        
        if not rules.exists():
            return []
        
        # Get time-off periods
        time_offs = TimeOff.objects.filter(
            professional=professional,
            end_date__gte=start_date,
            start_date__lte=end_date
        )
        
        # Get existing bookings
        bookings = Booking.objects.filter(
            professional=professional,
            start_datetime__date__gte=start_date,
            start_datetime__date__lte=end_date,
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED]
        ).values_list('start_datetime', 'end_datetime')
        
        booked_slots = set()
        for start_dt, end_dt in bookings:
            # Add buffer time
            booked_slots.add((
                start_dt - timedelta(minutes=AvailabilityService.SLOT_BUFFER_MINUTES),
                end_dt + timedelta(minutes=AvailabilityService.SLOT_BUFFER_MINUTES)
            ))
        
        # Generate slots
        slots = []
        current_date = start_date
        
        while current_date <= end_date:
            # Skip if date is in time-off
            if AvailabilityService._is_date_time_off(current_date, time_offs):
                current_date += timedelta(days=1)
                continue
            
            # Get rules for this day of week
            day_of_week = current_date.weekday()
            day_rules = rules.filter(day_of_week=day_of_week)
            
            for rule in day_rules:
                # Generate slots for this rule
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
        """Check if a date falls within any time-off period."""
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
        """Generate time slots for a specific rule on a specific date."""
        slots = []
        
        # Start from rule start time
        current_time = datetime.combine(current_date, rule.start_time)
        end_time = datetime.combine(current_date, rule.end_time)
        
        # Make timezone aware
        current_time = timezone.make_aware(current_time)
        end_time = timezone.make_aware(end_time)
        
        # Skip past slots
        now = timezone.now()
        if current_time < now:
            # Round up to next slot
            minutes_diff = (now - current_time).total_seconds() / 60
            slots_passed = int(minutes_diff // duration) + 1
            current_time += timedelta(minutes=duration * slots_passed)
        
        while current_time + timedelta(minutes=duration) <= end_time:
            slot_end = current_time + timedelta(minutes=duration)
            
            # Check if slot overlaps with any booked slot
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
            
            # Move to next slot
            current_time = slot_end + timedelta(minutes=AvailabilityService.SLOT_BUFFER_MINUTES)
        
        return slots
    
    @staticmethod
    def _slot_overlaps(start: datetime, end: datetime, booked_slots: set) -> bool:
        """Check if a slot overlaps with any booked slot."""
        for booked_start, booked_end in booked_slots:
            # Check for overlap
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
        Validate if a time slot is available for booking.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        from apps.bookings.models import Booking
        
        try:
            professional = User.objects.get(
                id=professional_id,
                role=User.Role.PROFESSIONAL,
                is_active=True
            )
        except User.DoesNotExist:
            return False, "Professional not found"
        
        # Check if slot is in the past
        if start_datetime < timezone.now():
            return False, "Cannot book slots in the past"
        
        # Check if within availability rules
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
        
        # Check time-off
        time_offs = TimeOff.objects.filter(
            professional=professional,
            start_date__lte=start_datetime.date(),
            end_date__gte=start_datetime.date()
        )
        
        if time_offs.exists():
            return False, "Professional is not available on this date"
        
        # Check for overlapping bookings
        overlapping = Booking.objects.filter(
            professional=professional,
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
            start_datetime__lt=end_datetime,
            end_datetime__gt=start_datetime
        )
        
        if exclude_booking_id:
            overlapping = overlapping.exclude(id=exclude_booking_id)
        
        if overlapping.exists():
            return False, "Slot is already booked"
        
        return True, ""
