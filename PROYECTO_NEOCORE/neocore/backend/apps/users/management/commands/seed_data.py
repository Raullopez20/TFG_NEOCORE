"""
Comando de gestión para poblar la base de datos con datos de demostración.

Uso:
    python manage.py seed_data

Crea un conjunto completo de datos de prueba para el sistema NeoCore:
    - 1 administrador (admin@neocore.com / admin123).
    - 4 profesionales con distintas especialidades.
    - 3 clientes de ejemplo.
    - 5 servicios asignados a los profesionales según su especialidad.
    - Reglas de disponibilidad (lunes a viernes, 09:00-18:00).
    - 1 período de vacaciones de ejemplo.
    - 2 reservas de ejemplo (una confirmada y una pendiente).

Este comando es idempotente: usa get_or_create para evitar duplicados
si se ejecuta múltiples veces.
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
    """
    Comando de Django para poblar la base de datos con datos iniciales.

    Ejecuta secuencialmente la creación de usuarios, servicios,
    disponibilidad y reservas de ejemplo. Al finalizar, muestra
    un resumen con las credenciales y cantidades creadas.
    """
    
    help = 'Puebla la base de datos con datos iniciales para pruebas y demostración'
    
    def handle(self, *args, **kwargs):
        """Punto de entrada principal del comando."""
        self.stdout.write('Iniciando la carga de datos de demostración...')
        
        # Crear usuarios por rol
        admin = self._create_admin()
        professionals = self._create_professionals()
        clients = self._create_clients()
        
        # Crear servicios y asignarlos a profesionales
        services = self._create_services(professionals)
        
        # Configurar disponibilidad de los profesionales
        self._create_availability_rules(professionals)
        self._create_time_offs(professionals)
        
        # Crear reservas de ejemplo en distintos estados
        self._create_sample_bookings(clients, professionals, services)
        
        # Resumen final
        self.stdout.write(self.style.SUCCESS('¡Base de datos poblada exitosamente!'))
        self.stdout.write(f'  - Admin: admin@neocore.com / admin123')
        self.stdout.write(f'  - Profesionales: {len(professionals)}')
        self.stdout.write(f'  - Clientes: {len(clients)}')
        self.stdout.write(f'  - Servicios: {len(services)}')
    
    # =========================================================================
    # Creación de usuarios
    # =========================================================================
    
    def _create_admin(self):
        """
        Crea el usuario administrador del sistema.

        Credenciales: admin@neocore.com / admin123
        Tiene permisos is_staff e is_superuser para acceso completo al admin.
        """
        admin, created = User.objects.get_or_create(
            email='admin@neocore.com',
            defaults={
                'username': 'neocore_root',
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
            self.stdout.write(f'  Creado admin: {admin.email}')
        return admin
    
    def _create_professionals(self):
        """
        Crea 4 profesionales de ejemplo con distintas especialidades.

        Especialidades: Fisioterapia, Nutrición, Entrenamiento Personal
        y Psicología Deportiva. Contraseña común: professional123.
        """
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
                self.stdout.write(f'  Creado profesional: {prof.email}')
            professionals.append(prof)
        
        return professionals
    
    def _create_clients(self):
        """
        Crea 3 clientes de ejemplo.

        Contraseña común: client123.
        """
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
                self.stdout.write(f'  Creado cliente: {client.email}')
            clients.append(client)
        
        return clients
    
    # =========================================================================
    # Creación de servicios
    # =========================================================================
    
    def _create_services(self, professionals):
        """
        Crea 5 servicios y los asigna a los profesionales según su especialidad.

        Cada servicio tiene nombre, descripción, duración en minutos y precio.
        Los profesionales se asignan automáticamente filtrando por coincidencia
        de especialidad entre el servicio y el profesional.
        """
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
                # Asignar profesionales que coincidan por especialidad
                matching_profs = [p for p in professionals if p.specialty == data['specialty']]
                service.professionals.set(matching_profs)
                self.stdout.write(f'  Creado servicio: {service.name}')
            services.append(service)
        
        return services
    
    # =========================================================================
    # Configuración de disponibilidad
    # =========================================================================
    
    def _create_availability_rules(self, professionals):
        """
        Crea reglas de disponibilidad estándar para todos los profesionales.

        Horario: Lunes a Viernes, de 09:00 a 18:00.
        Cada profesional recibe 5 reglas (una por día laborable).
        """
        for prof in professionals:
            for day in range(5):  # 0=Lunes ... 4=Viernes
                rule, created = AvailabilityRule.objects.get_or_create(
                    professional=prof,
                    day_of_week=day,
                    defaults={
                        'start_time': time(9, 0),
                        'end_time': time(18, 0),
                    }
                )
                if created:
                    self.stdout.write(f'  Creada regla de disponibilidad para {prof.get_full_name()} el día {day}')
    
    def _create_time_offs(self, professionals):
        """
        Crea un período de vacaciones de ejemplo para el primer profesional.

        Se programa una semana de vacaciones empezando 7 días después
        de la fecha actual.
        """
        next_week = date.today() + timedelta(days=7)
        TimeOff.objects.get_or_create(
            professional=professionals[0],
            start_date=next_week,
            end_date=next_week + timedelta(days=4),
            defaults={
                'reason': 'Vacaciones'
            }
        )
        self.stdout.write(f'  Creado período de ausencia para {professionals[0].get_full_name()}')
    
    # =========================================================================
    # Creación de reservas de ejemplo
    # =========================================================================
    
    def _create_sample_bookings(self, clients, professionals, services):
        """
        Crea reservas de ejemplo en distintos estados.

        Crea dos reservas:
            1. Reserva CONFIRMADA para mañana a las 10:00 (fisioterapia).
            2. Reserva PENDIENTE para pasado mañana a las 14:00 (nutrición).
        """
        if not clients or not professionals or not services:
            return
        
        # Fecha base: mañana a las 10:00
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        
        # Reserva confirmada: primer cliente con primer profesional (fisioterapia)
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
            self.stdout.write(f'  Creada reserva confirmada')
        
        # Reserva pendiente: segundo cliente con segundo profesional (nutrición)
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
            self.stdout.write(f'  Creada reserva pendiente')
