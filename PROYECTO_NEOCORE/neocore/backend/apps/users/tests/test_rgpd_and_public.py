from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.services.models import Service


User = get_user_model()


class UsersRGPDTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='client_test',
            email='client@example.com',
            password='Secret123!',
            first_name='Client',
            last_name='User',
            role=User.Role.CLIENT,
            gdpr_consent=True,
        )
        self.professional = User.objects.create_user(
            username='pro_test',
            email='pro@example.com',
            password='Secret123!',
            first_name='Pro',
            last_name='User',
            role=User.Role.PROFESSIONAL,
            specialty='Fisioterapia',
        )
        self.service = Service.objects.create(
            name='Fisioterapia',
            description='Sesion de prueba',
            duration_minutes=60,
            is_active=True,
        )
        self.service.professionals.add(self.professional)

    def test_professionals_list_is_public(self):
        response = self.client.get('/api/auth/users/professionals/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.professional.id)

    def test_export_me_returns_profile_and_booking_data(self):
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(minutes=60)
        Booking.objects.create(
            client=self.client_user,
            professional=self.professional,
            service=self.service,
            start_datetime=start,
            end_datetime=end,
            status=Booking.Status.CONFIRMED,
            client_notes='Nota test',
        )

        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/api/auth/users/me/export/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'client@example.com')
        self.assertEqual(len(response.data['bookings_as_client']), 1)
        self.assertEqual(response.data['bookings_as_client'][0]['status'], Booking.Status.CONFIRMED)

    def test_delete_me_requires_current_password(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.delete('/api/auth/users/me/delete/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_me_anonymizes_and_deactivates_account(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.delete(
            '/api/auth/users/me/delete/',
            {'current_password': 'Secret123!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.client_user.refresh_from_db()
        self.assertFalse(self.client_user.is_active)
        self.assertTrue(self.client_user.email.endswith('@deleted.local'))
        self.assertEqual(self.client_user.first_name, 'Deleted')
        self.assertEqual(self.client_user.last_name, 'User')
        self.assertFalse(self.client_user.has_usable_password())
