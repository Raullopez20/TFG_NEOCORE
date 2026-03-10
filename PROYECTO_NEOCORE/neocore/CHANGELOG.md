# Changelog

Todos los cambios notables en el proyecto NeoCore se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2024-01-15

### Añadido

#### Backend
- Sistema completo de autenticación con JWT
- OAuth 2.0 con Google
- Gestión de usuarios con roles (Cliente, Profesional, Admin)
- CRUD completo de servicios
- Sistema de reservas con estados (Pendiente → Confirmada → Completada)
- Gestión de disponibilidad de profesionales
  - Reglas recurrentes semanales
  - Períodos de ausencia (vacaciones)
- Generación dinámica de slots disponibles
- Sistema de notificaciones por email
- Tareas asíncronas con Celery
  - Envío de emails
  - Recordatorios 24h antes
- API REST completa (20+ endpoints)
- Documentación OpenAPI/Swagger
- Rate limiting por usuario y endpoint
- Permisos granulares por rol
- Tests con pytest
- Linters (Ruff, Black)

#### Frontend
- Aplicación Next.js 15 con App Router
- Sistema de autenticación completo
- i18n bilingüe (Español/Inglés)
- Dashboard para clientes
  - Ver próximas citas
  - Historial de reservas
  - Crear nuevas reservas
- Dashboard para profesionales
  - Agenda visual
  - Gestionar solicitudes pendientes
  - Configurar disponibilidad
  - Añadir ausencias
- Panel administrativo (Django Admin)
- Componentes UI con shadcn/ui
- Manejo de estado con React Query
- API client con Axios
- Toast notifications
- Validación de formularios
- Responsive design (móvil, tablet, escritorio)

#### DevOps
- Docker Compose con 7 servicios
- Nginx como reverse proxy
- PostgreSQL 15
- Redis para cache y cola
- Celery workers y beat scheduler
- GitHub Actions CI/CD
  - Tests automáticos
  - Linting
  - Security scanning
- Pre-commit hooks
- Makefile con comandos útiles
- Script de despliegue automatizado

#### Documentación
- README completo con guía paso a paso
- API documentation (todos los endpoints)
- Architecture decision records
- Deployment guide (VPS, AWS, DigitalOcean)
- Security guide
- Admin guide
- Quick start guide
- Contributing guidelines
- ERD diagram
- Diagramas de arquitectura

### Seguridad
- HTTPS/TLS ready
- CSRF protection
- CORS configurado
- Rate limiting
- SQL injection protection (Django ORM)
- XSS protection
- Password hashing (PBKDF2)
- JWT con refresh tokens
- Validación de inputs
- Sanitización de HTML

## [Unreleased]

### Planificado para v1.1.0
- [ ] Calendario integrado con FullCalendar
- [ ] Pagos online con Stripe
- [ ] Exportación de reservas a CSV/PDF
- [ ] Sistema de reseñas y valoraciones
- [ ] Chat en tiempo real (WebSockets)
- [ ] Notificaciones push
- [ ] App móvil (React Native)
- [ ] Dashboard analytics mejorado
- [ ] Multi-tenancy (múltiples clínicas)
- [ ] API v2 con GraphQL

### Posibles Mejoras Futuras
- [ ] Integración con calendarios externos (Google Calendar, Outlook)
- [ ] Recordatorios por SMS (Twilio)
- [ ] Sistema de fidelización de clientes
- [ ] Gestión de inventario
- [ ] Facturación automática
- [ ] Reportes personalizados
- [ ] Integración con sistemas de salud (HL7, FHIR)

---

## Tipos de Cambios

- **Añadido** - Para nuevas funcionalidades
- **Cambiado** - Para cambios en funcionalidad existente
- **Obsoleto** - Para funcionalidades que serán removidas
- **Eliminado** - Para funcionalidades eliminadas
- **Corregido** - Para corrección de bugs
- **Seguridad** - Para vulnerabilidades

## Versionado

Formato: `MAJOR.MINOR.PATCH`

- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de bugs compatibles
