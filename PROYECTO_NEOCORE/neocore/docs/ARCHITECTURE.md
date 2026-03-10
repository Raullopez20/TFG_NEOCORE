# NeoCore - Arquitectura del Sistema

## Visión General

NeoCore es una aplicación web moderna construida con arquitectura de microservicios desacoplados:

- **Backend**: API RESTful con Django REST Framework
- **Frontend**: Aplicación SPA con Next.js 15
- **Base de Datos**: PostgreSQL para persistencia
- **Cache/Cola**: Redis para cache y Celery para tareas asíncronas
- **Proxy**: Nginx como reverse proxy y balanceador

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Nginx (Port 80/443)                     │
│                    Reverse Proxy + Static Files                 │
└────────────┬──────────────────────────────────┬─────────────────┘
             │                                  │
             │ /api/*                           │ /*
             │ /admin/*                         │
             ▼                                  ▼
┌────────────────────────┐         ┌─────────────────────────────┐
│   Django Backend       │         │    Next.js Frontend         │
│   (Port 8000)          │         │    (Port 3000)              │
│                        │         │                             │
│  ┌──────────────────┐  │         │  ┌───────────────────────┐  │
│  │  Django REST     │  │         │  │  React Components     │  │
│  │  Framework       │  │         │  │  + TailwindCSS        │  │
│  └──────────────────┘  │         │  └───────────────────────┘  │
│  ┌──────────────────┐  │         │  ┌───────────────────────┐  │
│  │  Business Logic  │  │         │  │  React Query          │  │
│  │  (Services)      │  │         │  │  (State Management)   │  │
│  └──────────────────┘  │         │  └───────────────────────┘  │
│  ┌──────────────────┐  │         │  ┌───────────────────────┐  │
│  │  Django ORM      │  │         │  │  Axios API Client     │  │
│  └──────────────────┘  │         │  └───────────────────────┘  │
└────────┬───────────────┘         └─────────────────────────────┘
         │
         │
         ▼
┌────────────────────────┐         ┌─────────────────────────────┐
│   PostgreSQL           │         │   Redis                     │
│   (Port 5432)          │         │   (Port 6379)               │
│                        │         │                             │
│  - Users               │         │  - Session Cache            │
│  - Services            │         │  - Celery Broker            │
│  - Bookings            │         │  - Celery Results           │
│  - Availability        │         └─────────────────────────────┘
└────────────────────────┘
                                   ┌─────────────────────────────┐
                                   │   Celery Workers            │
                                   │                             │
                                   │  - Email Tasks              │
                                   │  - Notifications            │
                                   └─────────────────────────────┘
                                   ┌─────────────────────────────┐
                                   │   Celery Beat               │
                                   │                             │
                                   │  - Scheduled Tasks          │
                                   │  - Reminders (24h before)   │
                                   └─────────────────────────────┘
```

## Decisiones de Diseño

### 1. Separación Frontend/Backend

**Decisión**: Arquitectura desacoplada con API REST.

**Razones**:
- Escalabilidad independiente de frontend y backend
- Posibilidad de múltiples clientes (web, móvil)
- Desarrollo paralelo de equipos
- Mejor testing y mantenimiento

### 2. Django REST Framework

**Decisión**: Usar DRF para la API backend.

**Razones**:
- Ecosystem maduro y probado
- ORM robusto para operaciones de BD
- Sistema de permisos granular
- Integración con django-allauth para OAuth

### 3. Next.js con App Router

**Decisión**: Next.js 15 con nuevo App Router.

**Razones**:
- Server-side rendering (SEO)
- Mejor performance con React Server Components
- Sistema de routing integrado
- Optimización automática de imágenes

### 4. PostgreSQL

**Decisión**: PostgreSQL como base de datos principal.

**Razones**:
- ACID compliance
- Soporte avanzado para JSON
- Rendimiento en consultas complejas
- Confiabilidad en producción

### 5. Celery + Redis

**Decisión**: Celery para tareas asíncronas con Redis como broker.

**Razones**:
- Envío de emails no bloqueante
- Tareas programadas (recordatorios)
- Escalabilidad horizontal (workers)
- Monitoreo con Flower (opcional)

## Flujo de Datos

### Creación de Reserva (End-to-End)

```
1. Usuario (Frontend)
   └─> Click "Reservar"
       └─> Selecciona servicio, profesional, fecha/hora

2. Frontend
   └─> POST /api/bookings/
       └─> Axios request con JWT token

3. Backend (Django)
   └─> BookingViewSet.create()
       ├─> Validación de permisos (IsClient)
       ├─> BookingCreateSerializer.validate()
       │   └─> AvailabilityService.validate_slot_available()
       │       ├─> Verifica reglas de disponibilidad
       │       ├─> Verifica time-off
       │       └─> Verifica solapes
       ├─> Booking.save() → PostgreSQL
       └─> Signal post_save disparado

4. Signal (bookings/signals.py)
   └─> send_booking_notification.delay()
       └─> Tarea Celery encolada en Redis

5. Celery Worker
   └─> Procesa tarea send_booking_notification
       ├─> Genera contenido del email
       ├─> send_mail() vía SMTP
       └─> Guarda NotificationLog

6. Frontend
   └─> Recibe respuesta 201 Created
       └─> React Query invalida cache
           └─> UI actualizada con nueva reserva
```

## Modelo de Datos

### Entidades Principales

1. **User** (AbstractUser extendido)
   - Roles: CLIENT, PROFESSIONAL, ADMIN
   - Campos específicos por rol (specialty, bio para profesionales)

2. **Service**
   - Catálogo de servicios ofrecidos
   - M:N con User (profesionales)

3. **Booking**
   - Reserva entre cliente y profesional
   - Estados: PENDING → CONFIRMED/REJECTED → DONE/CANCELED

4. **AvailabilityRule**
   - Reglas recurrentes semanales
   - Horarios por día de la semana

5. **TimeOff**
   - Períodos de ausencia (vacaciones, etc.)
   - Rango de fechas

### Relaciones

```
User (CLIENT) ──┬──< Booking
                │
User (PROF)  ───┼──< Booking
                │   < AvailabilityRule
                │   < TimeOff
                │
Service ────────┴──< Booking
                   M:N User (PROF)
```

## Seguridad

### Autenticación

- JWT tokens (access + refresh)
- Rotación automática de refresh tokens
- Blacklist de tokens revocados

### Autorización

- Permisos basados en roles
- ViewSets con `get_permissions()` dinámico
- Filtrado de queryset según usuario

### Validación

- Serializers de DRF para input validation
- Validación de negocio en servicios
- Validación de disponibilidad en tiempo real

### Rate Limiting

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'booking': '10/minute',
    }
}
```

## Performance

### Caching

- Redis para sesiones
- QuerySet caching en vistas críticas
- React Query para cache de cliente

### Optimizaciones BD

- Índices en campos frecuentes (status, start_datetime)
- select_related() y prefetch_related()
- Paginación en listados

### Frontend

- Code splitting automático (Next.js)
- Lazy loading de componentes
- Optimización de imágenes

## Escalabilidad

### Horizontal

- Múltiples workers de Celery
- Múltiples instancias de Gunicorn
- Load balancing con Nginx

### Vertical

- Índices de BD optimizados
- Connection pooling
- Cache distribuido (Redis Cluster)

## Monitoreo

- Logs estructurados (JSON)
- Health check endpoint
- Métricas de Celery
- (Opcional) Prometheus + Grafana

## Testing

- Backend: pytest con fixtures
- Frontend: Jest + React Testing Library
- E2E: Playwright
- Coverage mínimo: 80%
