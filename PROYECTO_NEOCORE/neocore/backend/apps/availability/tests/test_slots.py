from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.availability.models import AvailabilityRule
from apps.services.models import Service


User = get_user_model()


class AvailabilitySlotsTests(APITestCase):
    def setUp(self):
        self.professional = User.objects.create_user(
            username='availability_pro_test',
            email='availability-pro@example.com',
            password='Secret123!',
            first_name='Availability',
            last_name='Pro',
            role=User.Role.PROFESSIONAL,
            specialty='Nutricion',
        )
        self.service = Service.objects.create(
            name='Consulta nutricional',
            description='Servicio test',
            duration_minutes=60,
            is_active=True,
        )
        self.service.professionals.add(self.professional)

        target_day = timezone.now() + timedelta(days=2)
        AvailabilityRule.objects.create(
            professional=self.professional,
            day_of_week=target_day.weekday(),
            start_time=target_day.replace(hour=9, minute=0, second=0, microsecond=0).time(),
            end_time=target_day.replace(hour=13, minute=0, second=0, microsecond=0).time(),
            is_active=True,
        )

    def test_public_get_slots_returns_data(self):
        start = (timezone.now() + timedelta(days=2)).date().isoformat()
        end = (timezone.now() + timedelta(days=3)).date().isoformat()

        response = self.client.get(
            '/api/availability/slots/get_slots/',
            {
                'professional_id': self.professional.id,
                'service_duration': self.service.duration_minutes,
                'start_date': start,
                'end_date': end,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('slots', response.data)
