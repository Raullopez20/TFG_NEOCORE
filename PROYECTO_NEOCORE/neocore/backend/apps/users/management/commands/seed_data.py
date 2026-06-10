"""
Comando de seed completo para NeoCore.
Crea 1 admin, 18 profesionales reales, 220 clientes, 21 servicios,
disponibilidad y reservas de ejemplo en varios estados.
"""

import random
from datetime import time, date, timedelta
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.services.models import Service
from apps.availability.models import AvailabilityRule, TimeOff
from apps.bookings.models import Booking

User = get_user_model()

# ── Nombres realistas ──────────────────────────────────────────────────────────
NOMBRES_M = ['Alejandro','Carlos','David','Diego','Eduardo','Fernando','Francisco',
             'Gabriel','Gonzalo','Hugo','Ignacio','Iván','Javier','Jesús','Jorge',
             'José','Juan','Julián','Luis','Manuel','Marcos','Mario','Martín',
             'Miguel','Nicolás','Pablo','Pedro','Rafael','Raúl','Roberto','Rodrigo',
             'Samuel','Sergio','Tomás','Víctor','Alberto','Álvaro','Adrián','Andrés']

NOMBRES_F = ['Alejandra','Ana','Andrea','Beatriz','Carmen','Clara','Cristina',
             'Elena','Eva','Gloria','Inés','Isabel','Laura','Lucía','Luna',
             'Marta','María','Nuria','Pilar','Rosa','Sara','Silvia','Sofía',
             'Valeria','Verónica','Alicia','Amparo','Ángela','Claudia','Diana',
             'Emma','Irene','Julia','Lara','Natalia','Olga','Patricia','Raquel']

APELLIDOS = ['García','Martínez','López','Sánchez','González','Pérez','Rodríguez',
             'Fernández','Torres','Ramírez','Flores','Díaz','Moreno','Jiménez',
             'Ruiz','Álvarez','Romero','Navarro','Domínguez','Castro','Ortega',
             'Serrano','Rubio','Morales','Delgado','Herrera','Vega','Molina',
             'Guerrero','Medina','Suárez','Ríos','Núñez','Vargas','Cabrera',
             'Aguilar','Fuentes','Ortiz','Reyes','Herrero','Iglesias','Blanco',
             'Cano','Giménez','Mendez','Santos','Peña','León','Marín','Prieto']

# ── Profesionales ──────────────────────────────────────────────────────────────
PROFESSIONALS_DATA = [
    {'email':'maria.garcia.fisio@neocore.com','first_name':'María','last_name':'García Ruiz',
     'specialty':'Fisioterapia','phone':'+34 600 111 001',
     'bio':'Fisioterapeuta titulada con 12 años de experiencia en rehabilitación deportiva y lesiones musculoesqueléticas. Máster en Fisioterapia Deportiva por la UCM.'},
    {'email':'juan.lopez.nutri@neocore.com','first_name':'Juan','last_name':'López Sánchez',
     'specialty':'Nutrición y Dietética','phone':'+34 600 111 002',
     'bio':'Nutricionista especializado en nutrición deportiva y pérdida de peso. Dietista-nutricionista con más de 8 años de experiencia clínica.'},
    {'email':'ana.martinez.entrenadora@neocore.com','first_name':'Ana','last_name':'Martínez Vega',
     'specialty':'Entrenamiento Personal','phone':'+34 600 111 003',
     'bio':'Entrenadora personal certificada por la NSCA. Especialista en fitness funcional, pilates y entrenamiento de fuerza para todos los niveles.'},
    {'email':'carlos.rodriguez.psico@neocore.com','first_name':'Carlos','last_name':'Rodríguez Blanco',
     'specialty':'Psicología Deportiva','phone':'+34 600 111 004',
     'bio':'Psicólogo deportivo con doctorado en Psicología del Deporte. Trabaja con deportistas de élite y personas que buscan mejorar su bienestar mental.'},
    {'email':'laura.fernandez.cardio@neocore.com','first_name':'Laura','last_name':'Fernández Torres',
     'specialty':'Cardiología','phone':'+34 600 111 005',
     'bio':'Cardióloga con más de 15 años de experiencia. Especializada en prevención cardiovascular, ecocardiografía y rehabilitación cardíaca.'},
    {'email':'pedro.sanchez.dermato@neocore.com','first_name':'Pedro','last_name':'Sánchez Moreno',
     'specialty':'Dermatología','phone':'+34 600 111 006',
     'bio':'Dermatólogo especializado en dermatología estética y médica. Experto en tratamiento del acné, envejecimiento cutáneo y enfermedades de la piel.'},
    {'email':'sofia.gonzalez.medgral@neocore.com','first_name':'Sofía','last_name':'González Herrera',
     'specialty':'Medicina General','phone':'+34 600 111 007',
     'bio':'Médico de familia con 20 años de trayectoria. Atención integral del paciente, medicina preventiva y seguimiento de enfermedades crónicas.'},
    {'email':'david.perez.osteo@neocore.com','first_name':'David','last_name':'Pérez Navarro',
     'specialty':'Osteopatía','phone':'+34 600 111 008',
     'bio':'Osteópata DO con especialización en osteopatía estructural y visceral. Más de 10 años tratando dolores de espalda, cervicales y cefaleas.'},
    {'email':'elena.torres.yoga@neocore.com','first_name':'Elena','last_name':'Torres Castillo',
     'specialty':'Yoga y Mindfulness','phone':'+34 600 111 009',
     'bio':'Instructora de yoga certificada por la Federación Internacional. Especialista en yoga terapéutico, meditación y técnicas de manejo del estrés.'},
    {'email':'miguel.ramirez.rehab@neocore.com','first_name':'Miguel','last_name':'Ramírez Flores',
     'specialty':'Rehabilitación','phone':'+34 600 111 010',
     'bio':'Médico rehabilitador especializado en recuperación post-quirúrgica y accidentes cerebrovasculares. Certificado en electromiografía diagnóstica.'},
    {'email':'cristina.moreno.podo@neocore.com','first_name':'Cristina','last_name':'Moreno Díaz',
     'specialty':'Podología','phone':'+34 600 111 011',
     'bio':'Podóloga especializada en biomecánica del pie, plantillas ortopédicas y cirugía podológica menor. Tratamiento de la fascitis plantar y juanetes.'},
    {'email':'jorge.jimenez.dietetica@neocore.com','first_name':'Jorge','last_name':'Jiménez Ruiz',
     'specialty':'Dietética Clínica','phone':'+34 600 111 012',
     'bio':'Dietista clínico especializado en enfermedades metabólicas, diabetes tipo 2, celiaquía y síndrome del intestino irritable. Master en Nutrición Clínica.'},
    {'email':'lucia.vega.pilates@neocore.com','first_name':'Lucía','last_name':'Vega Sanz',
     'specialty':'Pilates Terapéutico','phone':'+34 600 111 013',
     'bio':'Instructora certificada de Pilates terapéutico y suelo pélvico. Especializada en recuperación postparto, hernias discales y reeducación postural con más de 9 años de experiencia.'},
    {'email':'andres.molina.quiromasaje@neocore.com','first_name':'Andrés','last_name':'Molina Castro',
     'specialty':'Quiromasaje','phone':'+34 600 111 014',
     'bio':'Quiromasajista titulado y especialista en terapia manual. Experto en masaje descontracturante, drenaje linfático y técnicas miofasciales para el dolor crónico.'},
    {'email':'natalia.ortega.logopedia@neocore.com','first_name':'Natalia','last_name':'Ortega Marín',
     'specialty':'Logopedia','phone':'+34 600 111 015',
     'bio':'Logopeda colegiada especializada en trastornos del lenguaje infantil, dislexia, disfonías y rehabilitación de la deglución. Máster en Atención Temprana.'},
    {'email':'ruben.castro.trauma@neocore.com','first_name':'Rubén','last_name':'Castro Peña',
     'specialty':'Traumatología','phone':'+34 600 111 016',
     'bio':'Traumatólogo especialista en lesiones deportivas, patología de rodilla y hombro. Más de 14 años de experiencia en cirugía artroscópica y medicina regenerativa.'},
    {'email':'irene.delgado.psicologia@neocore.com','first_name':'Irene','last_name':'Delgado Fuentes',
     'specialty':'Psicología Clínica','phone':'+34 600 111 017',
     'bio':'Psicóloga general sanitaria especializada en terapia cognitivo-conductual, ansiedad, depresión y gestión del estrés. Más de 10 años de práctica clínica con adultos y adolescentes.'},
    {'email':'hector.serrano.acupuntura@neocore.com','first_name':'Héctor','last_name':'Serrano Gil',
     'specialty':'Acupuntura','phone':'+34 600 111 018',
     'bio':'Especialista en acupuntura y medicina tradicional china con formación en la Universidad de Medicina China de Pekín. Tratamiento del dolor, migrañas e insomnio.'},
]

# ── Servicios ──────────────────────────────────────────────────────────────────
SERVICES_DATA = [
    {'name':'Sesión de Fisioterapia','description':'Tratamiento fisioterapéutico personalizado para lesiones, contracturas y rehabilitación. Incluye evaluación inicial y plan de tratamiento.','duration_minutes':60,'price':48.00,'specialty':'Fisioterapia'},
    {'name':'Masaje Deportivo','description':'Masaje terapéutico enfocado en la recuperación muscular, prevención de lesiones y alivio de tensiones. Ideal pre y post competición.','duration_minutes':45,'price':40.00,'specialty':'Fisioterapia'},
    {'name':'Consulta Nutricional Completa','description':'Evaluación nutricional con análisis de composición corporal, historial alimentario y diseño de plan de alimentación personalizado.','duration_minutes':60,'price':55.00,'specialty':'Nutrición y Dietética'},
    {'name':'Seguimiento Nutricional','description':'Sesión de seguimiento del plan nutricional, revisión de evolución y ajuste de objetivos. Incluye bioimpedanciometría.','duration_minutes':30,'price':35.00,'specialty':'Nutrición y Dietética'},
    {'name':'Entrenamiento Personal','description':'Sesión de entrenamiento 1:1 totalmente personalizada según tus objetivos (pérdida de peso, ganancia muscular, rendimiento deportivo).','duration_minutes':60,'price':45.00,'specialty':'Entrenamiento Personal'},
    {'name':'Consulta de Psicología Deportiva','description':'Sesión individualizada para mejorar el rendimiento deportivo, gestionar la presión competitiva y trabajar la motivación y concentración.','duration_minutes':50,'price':60.00,'specialty':'Psicología Deportiva'},
    {'name':'Revisión Cardiológica','description':'Consulta cardiológica completa con electrocardiograma, medición de presión arterial y evaluación del riesgo cardiovascular.','duration_minutes':45,'price':80.00,'specialty':'Cardiología'},
    {'name':'Consulta Dermatológica','description':'Revisión dermatológica completa de la piel, diagnóstico y tratamiento de afecciones cutáneas, lunares y lesiones pigmentadas.','duration_minutes':30,'price':65.00,'specialty':'Dermatología'},
    {'name':'Sesión de Yoga Terapéutico','description':'Clase de yoga adaptada a tus necesidades físicas y emocionales. Combina asanas, pranayama y meditación para el bienestar integral.','duration_minutes':75,'price':35.00,'specialty':'Yoga y Mindfulness'},
    {'name':'Consulta de Osteopatía','description':'Tratamiento osteopático global del paciente. Diagnóstico y corrección de disfunciones musculoesqueléticas, viscerales y craneosacras.','duration_minutes':60,'price':55.00,'specialty':'Osteopatía'},
    {'name':'Consulta de Medicina General','description':'Consulta médica integral: valoración de síntomas, diagnóstico, prescripción y seguimiento de enfermedades comunes y crónicas. Medicina preventiva y consejo de salud.','duration_minutes':30,'price':40.00,'specialty':'Medicina General'},
    {'name':'Sesión de Rehabilitación Funcional','description':'Programa de rehabilitación personalizado tras cirugía o lesión. Recuperación de la movilidad, fuerza y funcionalidad con ejercicio terapéutico supervisado.','duration_minutes':60,'price':52.00,'specialty':'Rehabilitación'},
    {'name':'Estudio Biomecánico de la Pisada','description':'Análisis completo de la marcha y la pisada con plataforma de presiones. Incluye informe detallado y prescripción de plantillas personalizadas si son necesarias.','duration_minutes':45,'price':50.00,'specialty':'Podología'},
    {'name':'Quiropodia','description':'Tratamiento podológico integral: corte y fresado de uñas, eliminación de durezas, callosidades y helomas. Cuidado completo de la salud del pie.','duration_minutes':30,'price':28.00,'specialty':'Podología'},
    {'name':'Consulta de Dietética Clínica','description':'Abordaje nutricional de patologías: diabetes, hipertensión, celiaquía, intestino irritable y enfermedades metabólicas. Plan dietético terapéutico personalizado.','duration_minutes':45,'price':50.00,'specialty':'Dietética Clínica'},
    {'name':'Clase de Pilates Terapéutico','description':'Sesión de Pilates adaptada a tu condición física: fortalecimiento del core, reeducación postural y prevención del dolor de espalda. Grupos reducidos o individual.','duration_minutes':55,'price':30.00,'specialty':'Pilates Terapéutico'},
    {'name':'Quiromasaje Descontracturante','description':'Masaje terapéutico manual enfocado en eliminar contracturas, sobrecargas y tensión acumulada en espalda, cuello y hombros. Incluye valoración muscular previa.','duration_minutes':50,'price':38.00,'specialty':'Quiromasaje'},
    {'name':'Sesión de Logopedia','description':'Evaluación y tratamiento de trastornos del habla, lenguaje, voz y deglución en niños y adultos. Plan de intervención individualizado con seguimiento continuo.','duration_minutes':45,'price':42.00,'specialty':'Logopedia'},
    {'name':'Consulta de Traumatología','description':'Valoración especializada de lesiones del aparato locomotor: rodilla, hombro, columna. Diagnóstico, tratamiento conservador e indicación quirúrgica si procede.','duration_minutes':30,'price':75.00,'specialty':'Traumatología'},
    {'name':'Terapia Psicológica Individual','description':'Sesión de psicoterapia individual basada en terapia cognitivo-conductual. Tratamiento de ansiedad, depresión, estrés, autoestima y gestión emocional.','duration_minutes':55,'price':58.00,'specialty':'Psicología Clínica'},
    {'name':'Sesión de Acupuntura','description':'Tratamiento de acupuntura según la medicina tradicional china. Eficaz para el dolor crónico, migrañas, ansiedad e insomnio. Incluye diagnóstico energético inicial.','duration_minutes':45,'price':45.00,'specialty':'Acupuntura'},
]


class Command(BaseCommand):
    help = 'Seed realista: 18 profesionales, 220 clientes, 21 servicios y reservas de ejemplo'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING('NeoCore — Iniciando seed de datos realistas...'))

        admin = self._create_admin()
        professionals = self._create_professionals()
        clients = self._create_clients()
        services = self._create_services(professionals)
        self._create_availability(professionals)
        self._create_bookings(clients, professionals, services)

        self.stdout.write(self.style.SUCCESS('\n✓ Seed completado:'))
        self.stdout.write(f'  Admin:         admin@neocore.com / Admin.Demo.1234')
        self.stdout.write(f'  Profesionales: {len(professionals)} (contraseña: Prof.Demo.1234)')
        self.stdout.write(f'  Clientes:      {len(clients)} (contraseña: Client.Demo.1234)')
        self.stdout.write(f'  Servicios:     {len(services)}')

    # ── Admin ──────────────────────────────────────────────────────────────────
    def _create_admin(self):
        admin, created = User.objects.get_or_create(
            email='admin@neocore.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'NeoCore',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'gdpr_consent': True,
            }
        )
        if created:
            admin.set_password('Admin.Demo.1234')
            admin.save()
            self.stdout.write(f'  ✓ Admin creado: {admin.email}')
        else:
            self.stdout.write(f'  · Admin ya existe: {admin.email}')
        return admin

    # ── Profesionales ──────────────────────────────────────────────────────────
    def _create_professionals(self):
        professionals = []
        for i, data in enumerate(PROFESSIONALS_DATA):
            prof, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'specialty': data['specialty'],
                    'bio': data['bio'],
                    'phone': data['phone'],
                    'role': User.Role.PROFESSIONAL,
                    'gdpr_consent': True,
                }
            )
            if created:
                prof.set_password('Prof.Demo.1234')
                prof.save()
                self.stdout.write(f'  ✓ Profesional {i+1}/{len(PROFESSIONALS_DATA)}: {data["first_name"]} {data["last_name"]} ({data["specialty"]})')
            professionals.append(prof)
        return professionals

    # ── Clientes (bulk create para velocidad) ─────────────────────────────────
    def _create_clients(self):
        TARGET = 220
        existing_emails = set(User.objects.filter(role=User.Role.CLIENT).values_list('email', flat=True))
        hashed_pw = make_password('Client.Demo.1234')

        to_create = []
        generated = set()
        nombres = NOMBRES_M + NOMBRES_F
        idx = 0

        while len(to_create) + len(existing_emails) < TARGET:
            fn = nombres[idx % len(nombres)]
            ln1 = APELLIDOS[(idx * 3) % len(APELLIDOS)]
            ln2 = APELLIDOS[(idx * 7 + 5) % len(APELLIDOS)]
            email = f'{fn.lower().replace("á","a").replace("é","e").replace("í","i").replace("ó","o").replace("ú","u")}.{ln1.lower().replace("á","a").replace("é","e").replace("í","i").replace("ó","o").replace("ú","u").replace(" ","")}{idx}@neocore-demo.com'
            idx += 1
            if email in existing_emails or email in generated:
                continue
            generated.add(email)
            phone = f'+34 6{idx%9+10} {idx%900+100} {idx%900+100}'
            to_create.append(User(
                email=email,
                username=email,
                first_name=fn,
                last_name=f'{ln1} {ln2}',
                phone=phone,
                role=User.Role.CLIENT,
                password=hashed_pw,
                gdpr_consent=True,
                is_active=True,
            ))

        if to_create:
            User.objects.bulk_create(to_create, ignore_conflicts=True)
            self.stdout.write(f'  ✓ {len(to_create)} clientes creados en bloque')

        clients = list(User.objects.filter(role=User.Role.CLIENT)[:TARGET])
        self.stdout.write(f'  ✓ Total clientes en BD: {len(clients)}')
        return clients

    # ── Servicios ──────────────────────────────────────────────────────────────
    def _create_services(self, professionals):
        specialty_map = {}
        for p in professionals:
            specialty_map.setdefault(p.specialty, []).append(p)

        services = []
        for data in SERVICES_DATA:
            svc, created = Service.objects.get_or_create(
                name=data['name'],
                defaults={
                    'description': data['description'],
                    'duration_minutes': data['duration_minutes'],
                    'price': data['price'],
                    'is_active': True,
                }
            )
            if created:
                matching = specialty_map.get(data['specialty'], [])
                if matching:
                    svc.professionals.set(matching)
                self.stdout.write(f'  ✓ Servicio: {svc.name}')
            services.append(svc)
        return services

    # ── Disponibilidad (Lunes–Sábado con horarios variados) ───────────────────
    def _create_availability(self, professionals):
        schedules = [
            {'days': range(0, 5), 'start': time(9, 0),  'end': time(18, 0)},   # L-V 9-18
            {'days': range(0, 6), 'start': time(8, 30),  'end': time(17, 0)},  # L-S 8:30-17
            {'days': range(0, 5), 'start': time(10, 0), 'end': time(19, 0)},   # L-V 10-19
            {'days': [0,1,2,3],   'start': time(9, 0),  'end': time(15, 0)},   # L-J 9-15
            {'days': range(0, 5), 'start': time(8, 0),  'end': time(16, 0)},   # L-V 8-16
        ]
        for i, prof in enumerate(professionals):
            sch = schedules[i % len(schedules)]
            for day in sch['days']:
                AvailabilityRule.objects.get_or_create(
                    professional=prof,
                    day_of_week=day,
                    defaults={'start_time': sch['start'], 'end_time': sch['end']},
                )
        self.stdout.write(f'  ✓ Disponibilidad configurada para {len(professionals)} profesionales')

    # ── Reservas de ejemplo ───────────────────────────────────────────────────
    def _create_bookings(self, clients, professionals, services):
        if not clients or not professionals or not services:
            return

        created_count = 0
        now = timezone.now()

        statuses = [
            Booking.Status.CONFIRMED, Booking.Status.CONFIRMED,
            Booking.Status.PENDING, Booking.Status.DONE,
            Booking.Status.DONE, Booking.Status.CANCELED,
            Booking.Status.REJECTED,
        ]

        # 80 reservas distribuidas entre clientes, profesionales y servicios
        for i in range(80):
            client = clients[i % len(clients)]
            prof = professionals[i % len(professionals)]
            svc = services[i % len(services)]
            status = statuses[i % len(statuses)]

            # Fechas: mezcla de pasadas, próximas y futuras
            if i % 3 == 0:
                offset = timedelta(days=-(i % 30 + 1))     # pasada
            elif i % 3 == 1:
                offset = timedelta(days=(i % 14 + 1))      # próxima
            else:
                offset = timedelta(days=(i % 60 + 15))     # futura

            hour = 9 + (i % 8)
            start = (now + offset).replace(hour=hour, minute=0, second=0, microsecond=0)
            end = start + timedelta(minutes=svc.duration_minutes)

            # Para reservas pasadas completadas/canceladas
            if start < now and status in [Booking.Status.CONFIRMED]:
                status = Booking.Status.DONE

            _, created = Booking.objects.get_or_create(
                client=client,
                professional=prof,
                start_datetime=start,
                defaults={
                    'service': svc,
                    'end_datetime': end,
                    'status': status,
                    'client_notes': f'Reserva de prueba #{i+1}',
                }
            )
            if created:
                created_count += 1

        self.stdout.write(f'  ✓ {created_count} reservas de ejemplo creadas')
