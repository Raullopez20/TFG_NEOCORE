"""
Management command to seed the database with initial data.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import time, date, timedelta

from apps.services.models import Service
from apps.availability.models import AvailabilityRule, TimeOff
from apps.bookings.models import Booking

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with initial data for testing and demo'
    
    def handle(self, *args, **kwargs):
        self.stdout.write('Starting database seed...')
        
        # Create admin user
        admin = self._create_admin()
        
        # Create professionals
        professionals = self._create_professionals()
        
        # Create clients
        clients = self._create_clients()
        
        # Create services
        services = self._create_services(professionals)
        
        # Create availability rules
        self._create_availability_rules(professionals)
        
        # Create some time-off
        self._create_time_offs(professionals)
        
        # Create sample bookings
        self._create_sample_bookings(clients, professionals, services)
        
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write(f'  - Admin: admin@neocore.com / admin123')
        self.stdout.write(f'  - Professionals: {len(professionals)}')
        self.stdout.write(f'  - Clients: {len(clients)}')
        self.stdout.write(f'  - Services: {len(services)}')
    
    def _create_admin(self):
        admin, created = User.objects.get_or_create(
            email='admin@neocore.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'NeoCore',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(f'  Created admin: {admin.email}')
        return admin
    
    def _create_professionals(self):
        professionals_data = [
            {
                'email': 'maria.garcia@neocore.com',
                'first_name': 'María',
                'last_name': 'García',
                'specialty': 'Fisioterapia',
                'bio': 'Fisioterapeuta especializada en rehabilitación deportiva con 10 años de experiencia.',
                'phone': '+34 600 111 222',
            },
            {
                'email': 'juan.lopez@neocore.com',
                'first_name': 'Juan',
                'last_name': 'López',
                'specialty': 'Nutrición',
                'bio': 'Nutricionista deportivo certificado. Especializado en planes personalizados.',
                'phone': '+34 600 222 333',
            },
            {
                'email': 'ana.martinez@neocore.com',
                'first_name': 'Ana',
                'last_name': 'Martínez',
                'specialty': 'Entrenamiento Personal',
                'bio': 'Entrenadora personal con certificación internacional. Experta en fitness funcional.',
                'phone': '+34 600 333 444',
            },
            {
                'email': 'carlos.rodriguez@neocore.com',
                'first_name': 'Carlos',
                'last_name': 'Rodríguez',
                'specialty': 'Psicología Deportiva',
                'bio': 'Psicólogo deportivo especializado en alto rendimiento y bienestar mental.',
                'phone': '+34 600 444 555',
            },
        ]
        
        professionals = []
        for data in professionals_data:
            prof, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'specialty': data['specialty'],
                    'bio': data['bio'],
                    'phone': data['phone'],
                    'role': User.Role.PROFESSIONAL,
                }
            )
            if created:
                prof.set_password('professional123')
                prof.save()
                self.stdout.write(f'  Created professional: {prof.email}')
            professionals.append(prof)
        
        return professionals
    
    def _create_clients(self):
        clients_data = [
            {
                'email': 'pedro.sanchez@example.com',
                'first_name': 'Pedro',
                'last_name': 'Sánchez',
                'phone': '+34 611 111 111',
            },
            {
                'email': 'laura.fernandez@example.com',
                'first_name': 'Laura',
                'last_name': 'Fernández',
                'phone': '+34 622 222 222',
            },
            {
                'email': 'miguel.torres@example.com',
                'first_name': 'Miguel',
                'last_name': 'Torres',
                'phone': '+34 633 333 333',
            },
        ]
        
        clients = []
        for data in clients_data:
            client, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'phone': data['phone'],
                    'role': User.Role.CLIENT,
                }
            )
            if created:
                client.set_password('client123')
                client.save()
                self.stdout.write(f'  Created client: {client.email}')
            clients.append(client)
        
        return clients
    
    def _create_services(self, professionals):
        services_data = [
            {
                'name': 'Sesión de Fisioterapia',
                'description': 'Tratamiento fisioterapéutico personalizado para lesiones y rehabilitación.',
                'duration_minutes': 60,
                'price': 45.00,
                'specialty': 'Fisioterapia',
            },
            {
                'name': 'Consulta Nutricional',
                'description': 'Evaluación nutricional completa y plan alimenticio personalizado.',
                'duration_minutes': 45,
                'price': 50.00,
                'specialty': 'Nutrición',
            },
            {
                'name': 'Entrenamiento Personal',
                'description': 'Sesión de entrenamiento personalizado adaptado a tus objetivos.',
                'duration_minutes': 60,
                'price': 40.00,
                'specialty': 'Entrenamiento Personal',
            },
            {
                'name': 'Sesión de Psicología Deportiva',
                'description': 'Consulta psicológica para mejorar el rendimiento y bienestar mental.',
                'duration_minutes': 50,
                'price': 55.00,
                'specialty': 'Psicología Deportiva',
            },
            {
                'name': 'Masaje Deportivo',
                'description': 'Masaje terapéutico para recuperación muscular y prevención de lesiones.',
                'duration_minutes': 45,
                'price': 38.00,
                'specialty': 'Fisioterapia',
            },
        ]
        
        services = []
        for data in services_data:
            service, created = Service.objects.get_or_create(
                name=data['name'],
                defaults={
                    'description': data['description'],
                    'duration_minutes': data['duration_minutes'],
                    'price': data['price'],
                }
            )
            if created:
                # Assign professionals with matching specialty
                matching_profs = [p for p in professionals if p.specialty == data['specialty']]
                service.professionals.set(matching_profs)
                self.stdout.write(f'  Created service: {service.name}')
            services.append(service)
        
        return services
    
    def _create_availability_rules(self, professionals):
        # Create standard availability: Monday-Friday 9:00-18:00
        for prof in professionals:
            for day in range(5):  # Monday to Friday
                rule, created = AvailabilityRule.objects.get_or_create(
                    professional=prof,
                    day_of_week=day,
                    defaults={
                        'start_time': time(9, 0),
                        'end_time': time(18, 0),
                    }
                )
                if created:
                    self.stdout.write(f'  Created availability rule for {prof.get_full_name()} on day {day}')
    
    def _create_time_offs(self, professionals):
        # Create time-off for first professional (vacation next week)
        next_week = date.today() + timedelta(days=7)
        TimeOff.objects.get_or_create(
            professional=professionals[0],
            start_date=next_week,
            end_date=next_week + timedelta(days=4),
            defaults={
                'reason': 'Vacaciones'
            }
        )
        self.stdout.write(f'  Created time-off for {professionals[0].get_full_name()}')
    
    def _create_sample_bookings(self, clients, professionals, services):
        if not clients or not professionals or not services:
            return
        
        # Create some bookings in different states
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        
        # Confirmed booking
        service = services[0]
        booking, created = Booking.objects.get_or_create(
            client=clients[0],
            professional=professionals[0],
            service=service,
            start_datetime=tomorrow,
            defaults={
                'end_datetime': tomorrow + timedelta(minutes=service.duration_minutes),
                'status': Booking.Status.CONFIRMED,
                'client_notes': 'Primera sesión de fisioterapia',
            }
        )
        if created:
            self.stdout.write(f'  Created confirmed booking')
        
        # Pending booking
        day_after = tomorrow + timedelta(days=1)
        service2 = services[1]
        booking2, created = Booking.objects.get_or_create(
            client=clients[1],
            professional=professionals[1],
            service=service2,
            start_datetime=day_after.replace(hour=14, minute=0),
            defaults={
                'end_datetime': day_after.replace(hour=14, minute=0) + timedelta(minutes=service2.duration_minutes),
                'status': Booking.Status.PENDING,
                'client_notes': 'Necesito ayuda con mi alimentación',
            }
        )
        if created:
            self.stdout.write(f'  Created pending booking')
