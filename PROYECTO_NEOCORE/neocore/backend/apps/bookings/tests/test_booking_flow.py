from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.availability.models import AvailabilityRule
from apps.bookings.models import Booking
from apps.services.models import Service


User = get_user_model()


class BookingFlowTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='booking_client_test',
            email='booking-client@example.com',
            password='Secret123!',
            first_name='Booking',
            last_name='Client',
            role=User.Role.CLIENT,
        )
        self.professional = User.objects.create_user(
            username='booking_pro_test',
            email='booking-pro@example.com',
            password='Secret123!',
            first_name='Booking',
            last_name='Pro',
            role=User.Role.PROFESSIONAL,
            specialty='Fisioterapia',
        )
        self.service = Service.objects.create(
            name='Sesion avanzada',
            description='Sesion de prueba',
            duration_minutes=60,
            is_active=True,
        )
        self.service.professionals.add(self.professional)

        future = timezone.now() + timedelta(days=2)
        AvailabilityRule.objects.create(
            professional=self.professional,
            day_of_week=future.weekday(),
            start_time=future.replace(hour=9, minute=0, second=0, microsecond=0).time(),
            end_time=future.replace(hour=18, minute=0, second=0, microsecond=0).time(),
            is_active=True,
        )

    def test_client_can_create_booking(self):
        start = (timezone.now() + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0)
        end = start + timedelta(minutes=60)

        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(
            '/api/bookings/',
            {
                'service': self.service.id,
                'professional': self.professional.id,
                'start_datetime': start.isoformat(),
                'end_datetime': end.isoformat(),
                'client_notes': 'Primera sesion',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], Booking.Status.PENDING)

    def test_professional_cannot_create_booking(self):
        start = (timezone.now() + timedelta(days=2)).replace(hour=12, minute=0, second=0, microsecond=0)
        end = start + timedelta(minutes=60)

        self.client.force_authenticate(user=self.professional)
        response = self.client.post(
            '/api/bookings/',
            {
                'service': self.service.id,
                'professional': self.professional.id,
                'start_datetime': start.isoformat(),
                'end_datetime': end.isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_review_requires_done_booking(self):
        start = (timezone.now() + timedelta(days=3)).replace(hour=13, minute=0, second=0, microsecond=0)
        end = start + timedelta(minutes=60)
        booking = Booking.objects.create(
            client=self.client_user,
            professional=self.professional,
            service=self.service,
            start_datetime=start,
            end_datetime=end,
            status=Booking.Status.PENDING,
        )

        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(
            '/api/reviews/',
            {
                'booking': booking.id,
                'rating': 5,
                'comment': 'Excelente',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
