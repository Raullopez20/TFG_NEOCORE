# NeoCore - Sistema Integral de Reservas

**NeoCore** es un sistema completo de gestión de reservas para centros de salud y bienestar, desarrollado con Django REST Framework (backend) y Next.js 15 (frontend).

## 🚀 Características Principales

- **Sistema de Reservas**: Gestión completa del ciclo de vida de reservas (pendiente → confirmada → completada)
- **Múltiples Roles**: Cliente, Profesional y Administrador con permisos específicos
- **Especialidades**: Fisioterapia, Nutrición, Entrenamiento Personal, Psicología Deportiva
- **Disponibilidad Dinámica**: Horarios recurrentes, excepciones y períodos de ausencia
- **Notificaciones Email**: Confirmaciones automáticas y recordatorios 24h antes
- **Bilingüe**: Interfaz completa en Español e Inglés (ES/EN)
- **Responsive**: Diseño adaptativo para móvil, tablet y escritorio
- **Seguro**: Autenticación JWT, CSRF protection, rate limiting

## 🏗️ Arquitectura

```
neocore/
├── backend/           # Django 5 + DRF
│   ├── apps/
│   │   ├── users/     # Gestión de usuarios y autenticación
│   │   ├── services/  # Catálogo de servicios
│   │   ├── bookings/  # Sistema de reservas
│   │   ├── availability/  # Disponibilidad de profesionales
│   │   └── notifications/  # Sistema de notificaciones
│   └── neocore/       # Configuración Django
├── frontend/          # Next.js 15 + TypeScript
│   └── src/
│       ├── app/       # Pages (App Router)
│       ├── components/  # Componentes UI
│       ├── lib/       # Utilidades y API client
│       └── messages/  # Traducciones i18n
├── nginx/             # Reverse proxy
└── docker-compose.yml
```

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: Django 5.0 + Django REST Framework
- **Base de Datos**: PostgreSQL 15
- **Cache/Cola**: Redis + Celery
- **Autenticación**: JWT + django-allauth (Google OAuth)
- **API Docs**: drf-spectacular (OpenAPI/Swagger)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: React Query
- **i18n**: next-intl
- **Calendario**: FullCalendar

### DevOps
- **Contenedores**: Docker + Docker Compose
- **Servidor**: Nginx + Gunicorn
- **CI/CD**: GitHub Actions
- **Calidad**: Ruff, Black, ESLint, Prettier
- **Tests**: pytest (backend), Playwright (frontend)

## 📦 Instalación y Puesta en Marcha

### Requisitos Previos

- Docker >= 20.10
- Docker Compose >= 2.0
- Git

### Instalación Rápida (5 minutos)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/neocore.git
cd neocore

# 2. Copiar variables de entorno
cp .env.example .env

# 3. (Opcional) Editar .env con tus configuraciones
# Especialmente si necesitas configurar email SMTP o Google OAuth
nano .env

# 4. Construir y levantar los contenedores
docker-compose up -d --build

# 5. Esperar a que los servicios estén listos (~2 minutos)
# Puedes verificar con: docker-compose logs -f web

# 6. Ejecutar migraciones
docker-compose exec web python manage.py migrate

# 7. Crear superusuario de Django
docker-compose exec web python manage.py createsuperuser

# 8. Cargar datos de prueba (opcional pero recomendado)
docker-compose exec web python manage.py seed_data
```

### Acceso a la Aplicación

- **Frontend (Next.js)**: http://localhost:3000
- **API Backend**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/
- **API Docs (Swagger)**: http://localhost:8000/api/docs/

### Usuarios de Prueba (después de seed_data)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@neocore.com | admin123 |
| Profesional (Fisioterapia) | maria.garcia@neocore.com | professional123 |
| Profesional (Nutrición) | juan.lopez@neocore.com | professional123 |
| Cliente | pedro.sanchez@example.com | client123 |

## 🎯 Uso del Sistema

### Como Cliente

1. Registrarse o iniciar sesión
2. Explorar servicios disponibles
3. Seleccionar servicio y profesional
4. Elegir fecha y hora de los slots disponibles
5. Confirmar reserva
6. Recibir confirmación por email
7. Ver próximas citas en el panel

### Como Profesional

1. Iniciar sesión
2. Configurar disponibilidad (horarios recurrentes)
3. Añadir períodos de ausencia (vacaciones, etc.)
4. Ver y gestionar solicitudes pendientes
5. Confirmar o rechazar reservas
6. Marcar citas como completadas
7. Ver agenda en calendario

### Como Administrador

1. Iniciar sesión en el panel admin
2. Gestionar usuarios (crear profesionales, etc.)
3. Configurar servicios y duraciones
4. Asignar profesionales a servicios
5. Supervisar todas las reservas
6. Ver estadísticas del sistema

## 🧪 Testing

### Backend (pytest)

```bash
# Ejecutar todos los tests
docker-compose exec web pytest

# Con cobertura
docker-compose exec web pytest --cov --cov-report=html

# Solo tests unitarios
docker-compose exec web pytest -m unit
```

### Frontend (Playwright)

```bash
# Ejecutar tests E2E
docker-compose exec frontend npm run test:e2e
```

## 📋 Comandos Útiles (Makefile)

```bash
make up          # Levantar todos los servicios
make down        # Parar todos los servicios
make logs        # Ver logs en tiempo real
make shell       # Abrir shell de Django
make migrate     # Ejecutar migraciones
make superuser   # Crear superusuario
make seed        # Cargar datos de prueba
make test        # Ejecutar todos los tests
make lint        # Verificar código con linters
make fmt         # Formatear código
make clean       # Limpiar contenedores y volúmenes
```

## 🔒 Seguridad

- **Autenticación JWT**: Tokens con expiración y refresh automático
- **CSRF Protection**: Tokens CSRF en todas las peticiones de modificación
- **CORS**: Configurado solo para orígenes permitidos
- **Rate Limiting**: Límites en endpoints sensibles (10 req/min para reservas)
- **HTTPS**: Preparado para certificados SSL (ver docs/SECURITY.md)
- **Validación**: Validación de datos en backend y frontend
- **SQL Injection**: Protección mediante ORM de Django
- **XSS**: Escapado automático de templates

## 📊 Modelo de Datos (ERD Simplificado)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │       │   Service    │       │   Booking   │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id          │◄──┐   │ id           │       │ id          │
│ email       │   │   │ name         │       │ client_id   │───┐
│ role        │   │   │ description  │       │ professional│───┤
│ specialty   │   │   │ duration     │       │ service_id  │───┤
│ ...         │   │   │ price        │       │ start_dt    │   │
└─────────────┘   │   └──────────────┘       │ end_dt      │   │
                  │          │               │ status      │   │
                  │          │M:N            └─────────────┘   │
                  │   ┌──────▼────────┐                        │
                  │   │ServiceProfess.│                        │
                  │   └───────────────┘                        │
                  │                                            │
                  │   ┌──────────────┐                         │
                  └───┤AvailRule     │                         │
                      ├──────────────┤                         │
                      │professional  │                         │
                      │day_of_week   │                         │
                      │start_time    │                         │
                      │end_time      │                         │
                      └──────────────┘                         │
                                                               │
                      ┌──────────────┐                         │
                      │   TimeOff    │                         │
                      ├──────────────┤                         │
                      │professional  │◄────────────────────────┘
                      │start_date    │
                      │end_date      │
                      └──────────────┘
```

## 🔄 Flujo de Reserva

```
1. Cliente crea reserva
   ↓
2. Estado: PENDING
   ↓
3. Email → Profesional (nueva solicitud)
   ↓
4. Profesional decide:
   ├─ CONFIRMAR → Estado: CONFIRMED → Email a cliente
   └─ RECHAZAR  → Estado: REJECTED  → Email a cliente
   ↓
5. Si confirmada:
   └─ Recordatorio 24h antes (Celery Beat)
   ↓
6. Tras la cita:
   └─ Profesional marca: DONE
```

## 📝 Variables de Entorno Importantes

```bash
# Django
SECRET_KEY=tu-clave-secreta-muy-larga-y-aleatoria
DEBUG=False  # ¡NUNCA True en producción!

# Base de Datos
POSTGRES_DB=neocore_db
POSTGRES_USER=neocore_user
POSTGRES_PASSWORD=contraseña-segura

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

## 🚢 Despliegue en Producción

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para guía completa de despliegue en:
- AWS (EC2 + RDS + S3)
- Digital Ocean
- Heroku + Heroku Postgres
- VPS genérico

Pasos clave:
1. Configurar variables de entorno de producción
2. Cambiar `DEBUG=False`
3. Configurar `ALLOWED_HOSTS`
4. Usar certificados SSL/TLS (Let's Encrypt)
5. Configurar servicio SMTP real
6. Backups automáticos de base de datos

## 📚 Documentación Adicional

- [API Reference](docs/API.md) - Documentación completa de endpoints
- [Architecture](docs/ARCHITECTURE.md) - Decisiones de diseño y arquitectura
- [Security](docs/SECURITY.md) - Guía de seguridad y mejores prácticas
- [Admin Guide](docs/ADMIN_GUIDE.md) - Manual para administradores

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Estándares de Código

- Backend: `ruff` + `black`
- Frontend: `eslint` + `prettier`
- Commits: Conventional Commits
- Tests: Cobertura mínima 80%

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Desarrollado como Trabajo de Fin de Grado (TFG) - DAW 2024/2025

## 🙏 Agradecimientos

- Django y Django REST Framework por el excelente backend framework
- Next.js team por el mejor framework React
- Shadcn/ui por los componentes UI
- La comunidad open-source

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta a través de [tu-email]
