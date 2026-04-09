# NeoCore — Documentacion Tecnica TFG

> Sistema integral de reservas para un centro de salud y bienestar.
> URL en produccion: https://neocoree.xyz

---

## 1. Introduccion y Objetivos

### 1.1 Descripcion del proyecto

**NeoCore** es una plataforma web completa para la gestion de reservas en un
centro de salud / bienestar. El sistema cubre el ciclo completo:

- Catalogo publico de **servicios** y **profesionales**.
- **Registro y autenticacion** de pacientes y profesionales.
- Sistema de **reservas** con calculo automatico de slots disponibles.
- **Dashboard** diferenciado por rol (cliente, profesional, administrador).
- **Backoffice** propio para administradores.
- **Resenas** post-cita para mejorar la confianza del catalogo.
- **Notificaciones** por email asincronas (Celery).

### 1.2 Objetivos funcionales

| # | Objetivo | Estado |
|---|----------|--------|
| 1 | Catalogo publico de servicios y profesionales | OK |
| 2 | Registro / login con politica de contrasenas robustas | OK |
| 3 | Reservas con seleccion de slot disponible | OK |
| 4 | Maquina de estados de cita (PENDING, CONFIRMED, DONE, CANCELED, REJECTED) | OK |
| 5 | Dashboard de cliente: proximas citas e historial | OK |
| 6 | Dashboard de profesional: agenda y gestion de horario | OK |
| 7 | Backoffice de administrador: usuarios, reservas, servicios, KPIs | OK |
| 8 | Resenas con moderacion (`is_visible`) | OK |
| 9 | Notificaciones por email asincronas | OK |
| 10 | Cumplimiento basico RGPD (consentimiento, exportacion, derecho al olvido) | OK |

### 1.3 Objetivos tecnicos

- Arquitectura **decoupled**: backend API REST + frontend SPA.
- **Seguridad por defecto**: JWT, argon2, rate limiting, headers CSP, axes.
- Codigo **mantenible**: type-safe (TypeScript), DRF serializers, tests.
- **Despliegue moderno**: Vercel (frontend) + backend en contenedor.

---

## 2. Tecnologias Utilizadas y Justificacion

### 2.1 Backend

| Tecnologia | Version | Justificacion |
|------------|---------|---------------|
| **Python** | 3.11+ | LTS, ecosystem maduro, soporte excelente para Django. |
| **Django** | 4.2 LTS | Soporte hasta abril 2026, ORM potente, admin nativo, baterias incluidas. Frente a Flask/FastAPI: el coste fijo de Django es mayor pero a cambio se obtiene auth, ORM, migraciones, admin, signals, validacion y middlewares sin ensamblar nada. Para un TFG con multiples entidades relacionadas (User, Booking, Service, Availability, Review), Django acelera el desarrollo. |
| **Django REST Framework** | 3.14 | Estandar de facto para APIs REST en Django. ViewSets + Serializers + permission_classes cubren el 90% de los casos. |
| **PostgreSQL** | 15 | Base de datos relacional robusta. Soporte para JSONB, indices avanzados, integridad referencial estricta. SQLite descartada por concurrencia. |
| **simplejwt + djoser** | - | JWT con refresh tokens, integracion con DRF, endpoints listos para registro y reset de contrasenas. |
| **argon2-cffi** | - | Hashing de contrasenas resistente a GPU/ASIC, ganador del Password Hashing Competition. |
| **django-axes** | - | Bloqueo automatico tras N intentos fallidos, persistente en BD. |
| **django-ratelimit** | - | Rate limiting por IP/usuario en endpoints sensibles (login, contact). |
| **django-csp** | - | Cabeceras Content-Security-Policy automaticas. |
| **encrypted-model-fields** | - | Cifrado en BD de campos sensibles (telefono, bio, notas medicas). |
| **drf-spectacular** | - | OpenAPI 3 / Swagger automatico en `/api/docs/`. |
| **Celery + Redis** | - | Tareas asincronas (envio de emails, recordatorios 24h antes). |
| **pytest-django + factory-boy** | - | Tests unitarios y de integracion. |

### 2.2 Frontend

| Tecnologia | Version | Justificacion |
|------------|---------|---------------|
| **Next.js** | 15 (App Router) | Framework React de referencia. App Router permite layouts anidados, middleware, RSC y SSR. Frente a Vite/CRA: Next.js trae routing, optimizacion de imagenes, i18n y deploy directo a Vercel sin configuracion. |
| **TypeScript** | 5+ | Type-safety en interfaces compartidas con la API. Imprescindible para refactors seguros. |
| **Tailwind CSS** | 3+ | Utility-first, evita CSS huerfano, build minimo. |
| **lucide-react** | - | Iconos SVG tree-shakable. |
| **axios** | - | Cliente HTTP con interceptors para refresh de JWT. |
| **TanStack Query** | - | Cache de datos del servidor con invalidation automatica. |
| **next-intl** | - | i18n SSR-friendly (es / en) con segmentos de URL. |

### 2.3 Despliegue

- **Vercel** para el frontend Next.js: builds automaticos por push, CDN global, middleware en edge.
- **Backend en contenedor** (Dockerfile + docker-compose): proxy nginx, gunicorn, postgres, redis.
- **Neon** (PostgreSQL serverless) para la base de datos en produccion (alternativa: Supabase).

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama (logico)

```
+----------------+        HTTPS         +-------------------+
|                |  ------------------> |                   |
|  Navegador     |                      |  Vercel Edge      |
|  (Next.js)     |  <------------------ |  (Next.js SSR +   |
|                |     HTML/JSON        |   middleware i18n)|
+----------------+                      +---------+---------+
                                                  |
                                                  | rewrite /api/* ->
                                                  v
                                        +-------------------+
                                        |  Backend Django   |
                                        |  + DRF + Celery   |
                                        |  (gunicorn/nginx) |
                                        +---------+---------+
                                                  |
                          +-----------------------+--------------------+
                          |                       |                    |
                          v                       v                    v
                  +---------------+      +----------------+    +-------------+
                  |  PostgreSQL   |      |     Redis      |    |    SMTP     |
                  |  (Neon/local) |      |  (broker celery|    | (mailgun /  |
                  |               |      |   + cache)     |    |   resend)   |
                  +---------------+      +----------------+    +-------------+
```

### 3.2 Patron arquitectonico

NeoCore NO sigue el patron MTV monolitico clasico de Django. Es una
**arquitectura desacoplada (decoupled / headless)**:

- **Backend Django** = solo API REST. Sin templates de negocio, solo ViewSets,
  Serializers y permisos. Todas las apps (`users`, `services`, `bookings`,
  `availability`, `notifications`) exponen endpoints bajo `/api/`.
- **Frontend Next.js** = cliente SPA con SSR opcional. Consume la API por
  HTTP, gestiona el estado y la navegacion. Cada pagina es un componente
  React server-rendered.

#### Por que decoupled

1. **Separacion de responsabilidades**: el backend solo se ocupa de datos y
   reglas de negocio. La UI es totalmente independiente.
2. **Escalabilidad**: ambos lados se escalan de forma independiente.
3. **Reutilizacion**: la misma API puede alimentar una app movil.
4. **DX moderna**: Next.js + TypeScript dan hot reload y type-safety
   end-to-end.

### 3.3 Sistema de roles y permisos

El backend define `User.Role` con tres valores:

```python
class Role(models.TextChoices):
    CLIENT = "CLIENT", "Cliente"
    PROFESSIONAL = "PROFESSIONAL", "Profesional"
    ADMIN = "ADMIN", "Administrador"
```

Y permisos DRF en `apps/users/permissions.py`:

```python
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin_role

class IsProfessional(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_professional

class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_client
```

En el frontend, cada pagina protegida implementa un **AdminGuard** /
**ProfessionalGuard** que en `useEffect` llama a `authAPI.me()` y redirige
si el rol no coincide. Esto NO es seguridad real (siempre se valida en
backend), pero mejora la UX evitando flashes de contenido prohibido.

### 3.4 Flujo de una peticion HTTP

```
1. Usuario navega a https://neocoree.xyz/es/services
2. Vercel sirve la pagina Next.js (RSC + hidratacion)
3. El componente <ServicesPage> llama a servicesAPI.list() (axios)
4. axios -> /api/services/ (mismo origen)
5. next.config.js rewrites: /api/:path* -> BACKEND_API_URL/api/:path*
6. Backend Django: URLConf -> ServiceViewSet.list
7. DRF aplica AllowAny, paginacion, filtros
8. ORM: Service.objects.filter(is_active=True) con select_related
9. ServiceSerializer convierte a JSON
10. Respuesta -> Vercel -> navegador -> render
```

---

## 4. Modelo de Datos

### 4.1 Entidades principales

```
User (apps.users)
  - id, email (unique, USERNAME_FIELD), first_name, last_name
  - role: CLIENT | PROFESSIONAL | ADMIN
  - phone (encrypted), bio (encrypted), specialty
  - profile_image, gdpr_consent, is_active
  - created_at, updated_at

Service (apps.services)
  - id, name, description
  - duration_minutes (PositiveInt)
  - price (Decimal)
  - is_active, image
  - professionals (M2M -> User where role=PROFESSIONAL)

Booking (apps.bookings)
  - id, client (FK User where role=CLIENT)
  - professional (FK User where role=PROFESSIONAL)
  - service (FK Service)
  - start_datetime, end_datetime
  - status: PENDING | CONFIRMED | REJECTED | CANCELED | DONE
  - client_notes (encrypted), professional_notes (encrypted)
  - cancellation_reason, canceled_by (FK User)
  - reminder_sent: bool
  - created_at, updated_at
  - indices: (status, start_datetime), (professional, start_datetime)

Review (apps.bookings) [NUEVO]
  - id, booking (OneToOne -> Booking, CASCADE)
  - rating: 1-5
  - comment (max 2000)
  - is_visible: bool
  - created_at, updated_at

AvailabilityRule (apps.availability)
  - id, professional (FK User)
  - day_of_week: 0-6
  - start_time, end_time
  - is_active

TimeOff (apps.availability)
  - id, professional (FK User)
  - start_date, end_date
  - reason

ContactMessage (apps.notifications) [NUEVO]
  - id, name, email, phone, subject, message
  - is_read, replied_at, created_at
```

### 4.2 Decisiones de diseno

- **No hay `ClientProfile` / `ProfessionalProfile` separados**: todos los
  campos viven en `User`. Razon: simplifica las queries y evita N+1. Los
  campos especificos por rol se validan en `clean()` con `role`.
- **`Booking` con FK directa a `User`** (no a un perfil intermedio):
  reduce joins. La integridad por rol se garantiza con `limit_choices_to`.
- **`Review` como `OneToOneField` a `Booking`**: una resena por cita. Esto
  permite calcular `professional.average_rating` con un join simple sobre
  `booking__professional_id`.
- **M2M `Service.professionals`**: un servicio lo pueden ofrecer varios
  profesionales y un profesional puede ofrecer varios servicios.
- **Indices BD**: en campos usados en filtros frecuentes (`status`,
  `start_datetime`, `professional_id`).
- **Cifrado en BD** (django-encrypted-model-fields) para campos sensibles
  (telefono, notas medicas) — defensa en profundidad ante leak de BD.

---

## 5. Sistema de Autenticacion

### 5.1 CustomUser

Se extiende `AbstractUser` (no `AbstractBaseUser`) porque:

- `AbstractUser` ya trae los campos basicos (`username`, `email`, `first_name`,
  `last_name`, `is_active`, `is_staff`, `is_superuser`, `groups`, `permissions`)
  y los flujos de Django (admin, auth, signals).
- Solo necesitamos **anadir** campos (`role`, `phone`, `bio`...) y cambiar
  `USERNAME_FIELD` a `email`. No reescribir todo.

```python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(choices=Role.choices, default=Role.CLIENT)
    phone = EncryptedCharField(...)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
```

### 5.2 Flujo JWT

1. **POST `/api/auth/login/`** con email/password.
2. Backend valida con argon2, comprueba `django-axes`, y devuelve
   `{access, refresh}`.
3. Frontend guarda ambos en `localStorage` y los inyecta en cada request
   via `axios.interceptors.request`.
4. Si el access expira (401), un interceptor de respuesta intenta
   `POST /api/auth/token/refresh/`. Si falla, hace logout y redirige.

### 5.3 Reset de contrasena

`POST /api/auth/password/reset/` (djoser) -> envia email con token UUID
firmado -> usuario abre link -> formulario `/forgot-password` -> POST
con token y nueva contrasena.

---

## 6. Sistema de Reservas (Logica de Negocio)

### 6.1 Calculo de slots disponibles

`apps/availability/services.py::AvailabilityService.get_available_slots`:

```
Para cada dia en [start_date, end_date]:
  weekday = dia.weekday()
  reglas = AvailabilityRule.filter(professional, day_of_week=weekday, is_active=True)
  Para cada regla:
    slot = start_time
    Mientras slot + duration <= end_time:
      candidate_start = combine(dia, slot)
      candidate_end = candidate_start + duration
      ocupado = Booking.exists(
        professional, status in (PENDING, CONFIRMED),
        start_datetime < candidate_end, end_datetime > candidate_start
      )
      ausente = TimeOff.exists(professional, start_date <= dia <= end_date)
      if not ocupado and not ausente:
        yield candidate_start
      slot += step (15 min)
```

### 6.2 Maquina de estados

```
                  +---------+
   Cliente        |         | Profesional rechaza
   crea --------> | PENDING |---------------------> REJECTED
                  |         |
                  +----+----+
                       |
                       | Profesional confirma
                       v
                  +-----------+
                  | CONFIRMED |
                  +-----+-----+
                        |
       +----------------+----------------+
       |                                 |
       v                                 v
  +---------+ Cliente/Pro       +-----------+
  | CANCELED| cancela           |   DONE    | <-- mark_done tras la fecha
  +---------+                   +-----------+
                                      |
                                      v
                                +----------+
                                |  Review  |  (cliente deja resena)
                                +----------+
```

### 6.3 Politicas de cancelacion

- **Cliente**: solo si faltan **>24h** para la cita. Implementado en
  `BookingViewSet.cancel` con validacion en backend.
- **Profesional**: siempre, con `cancellation_reason` obligatorio.
- **Admin**: siempre, sin restricciones.

### 6.4 Notificaciones

Cada transicion dispara una tarea Celery (`apps.notifications.tasks`) que
envia un email:

- `PENDING` -> email al cliente ("Solicitud recibida") y al profesional
  ("Nueva solicitud").
- `CONFIRMED` -> email al cliente.
- `CANCELED` / `REJECTED` -> email a la otra parte con motivo.
- `DONE` (24h despues) -> email al cliente pidiendo resena.
- Recordatorio **24h antes** via `Booking.reminder_sent` flag.

---

## 7. Panel de Administracion (Backoffice)

### 7.1 Por que un backoffice propio en lugar de `/admin/`

1. **Seguridad**: el `/admin/` de Django es un objetivo conocido para
   ataques. Lo escondemos detras de `ADMIN_PATH` aleatorio y plantamos
   un `admin_honeypot` en `/admin/`.
2. **UX**: el admin de Django es funcional pero no tiene la misma estetica
   ni las mismas capacidades visuales (graficos, KPIs, modales). Para un
   gestor no tecnico es confuso.
3. **Coherencia**: todo el resto del producto vive en Next.js. Tener el
   admin tambien en Next.js evita cambiar de paradigma.

### 7.2 Estructura

```
/[locale]/backoffice/
  layout.tsx       - AdminGuard + sidebar dark navy #1e2a3a
  page.tsx         - redirect a /backoffice/dashboard
  dashboard/       - KPIs, alertas, graficos, tablas
  users/           - CRUD usuarios, filtros, cambio de rol
  bookings/        - todas las reservas, filtro por estado
  services/        - CRUD servicios con modal
```

Endpoints consumidos: todos `/api/...` con permiso `IsAdmin`. La sesion
es la misma que la del usuario normal — no hay segundo login.

### 7.3 Funcionalidades

- **Dashboard**: KPIs (reservas hoy, pendientes, confirmadas, completadas),
  alertas (PENDING > 24h), grafico de barras por servicio y por profesional,
  tablas de ultimas reservas y ultimos usuarios.
- **Usuarios**: tabla con buscador debounced, filtro por rol y estado,
  cambio de rol inline, activar/desactivar, eliminar.
- **Reservas**: listado con filtro por estado y buscador, accion de
  cancelar con motivo via prompt.
- **Servicios**: grid de cards con CRUD via modal.

---

## 8. Seguridad

### 8.1 Medidas implementadas

| Medida | Donde | Para que |
|--------|-------|----------|
| Argon2id | `PASSWORD_HASHERS` | Hashing fuerte, resistente a GPU. |
| django-axes | `AUTHENTICATION_BACKENDS` | Bloqueo tras 5 intentos fallidos. |
| django-ratelimit | `SecureLoginView`, `ContactMessageView` | Rate limit por IP. |
| JWT con refresh | simplejwt | Sesiones sin estado, revocacion via blacklist. |
| CSP | django-csp middleware | Cabeceras Content-Security-Policy. |
| HSTS | settings.SECURE_HSTS_SECONDS | Forzar HTTPS en navegadores. |
| CSRF | DRF + cookie | Para flujos basados en cookie de sesion. |
| Cifrado en BD | EncryptedCharField | Telefono, bio, notas medicas. |
| Honeypot | `/admin/` | Detectar escaneadores que buscan admin. |
| ADMIN_PATH oculto | settings | URL real del admin no descubrible. |
| bleach | en serializers | Sanitizacion XSS de campos de texto libre. |
| ORM Django | siempre | Previene SQL injection. |
| `limit_choices_to` | FKs Booking | Integridad por rol a nivel BD. |

### 8.2 RGPD

- `User.gdpr_consent: bool` registrado en el registro.
- Endpoint `/api/users/me/export/` que devuelve toda la info del usuario en JSON.
- Endpoint `/api/users/me/delete/` que elimina la cuenta y anonimiza
  reservas pasadas (no se borran por integridad historica).

---

## 9. Testing

### 9.1 Estrategia

- **Unitarios**: modelos (validaciones, metodos), serializers.
- **Integracion**: endpoints DRF (auth, permisos, CRUD).
- **End-to-end**: flujo completo de reserva (crear -> confirmar -> done -> resena).
- **Seguridad**: rate limit en login, CSRF activo, SQL injection en buscador.

### 9.2 Como ejecutar

```bash
cd backend
pytest --cov=apps --cov-report=html -v
# El reporte HTML se genera en htmlcov/index.html
```

### 9.3 Casos clave

- `test_booking_cancellation_24h_rule`: cliente intenta cancelar a < 24h y recibe 400.
- `test_review_only_after_done`: cliente intenta reseñar una cita PENDING y recibe 400.
- `test_admin_access_to_backoffice_endpoints`: cliente recibe 403, admin recibe 200.
- `test_get_available_slots_excludes_overlapping`: dos reservas en el mismo
  hueco solo dejan una libre.

---

## 10. Despliegue

### 10.1 Vercel (frontend)

- Repo conectado, build automatico por push a `main`.
- Variables: `BACKEND_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_LOCALE`.
- El `next.config.js` aplica `rewrites()` para que `/api/*` proxyee a
  `BACKEND_API_URL/api/*`. Esto **debe** ir acompañado de excluir `/api`
  del matcher de `next-intl/middleware` (bug arreglado en commit
  `582241c`).

### 10.2 Backend

Opciones validadas:

1. **Railway / Render** con Dockerfile + Postgres + Redis administrados.
2. **VPS propio** con docker-compose (`docker-compose.yml` en raiz):
   nginx + gunicorn + postgres + redis + celery worker + celery beat.

Variables criticas:

```
DJANGO_SECRET_KEY
DJANGO_ALLOWED_HOSTS
DATABASE_URL=postgres://...
REDIS_URL=redis://...
EMAIL_HOST / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD
FIELD_ENCRYPTION_KEY  (django-encrypted-model-fields)
ADMIN_PATH=algo_aleatorio_para_no_/admin/
CORS_ALLOWED_ORIGINS=https://neocoree.xyz
```

### 10.3 Base de datos en produccion

- Provider recomendado: **Neon** (serverless Postgres con branching).
- Migraciones: `python manage.py migrate` ejecutado en el entrypoint del
  contenedor.
- Backups: Neon hace snapshots diarios automaticos.

### 10.4 Limitaciones conocidas

- Si se despliega backend en Vercel Functions: Vercel tiene timeout de 10s,
  inadecuado para Celery. Por eso el backend va en contenedor aparte.
- Whitenoise sirve estaticos pero no acepta uploads grandes — el media
  esta delegado a Cloudinary.

---

## 11. Manual de Usuario

### 11.1 Cliente

1. Registrarse en `/es/register` con email, contrasena y consentimiento RGPD.
2. Iniciar sesion en `/es/login`.
3. Navegar a `/es/services` y elegir un servicio.
4. Pulsar "Reservar" -> seleccionar profesional -> seleccionar slot
   disponible -> confirmar.
5. Ver el estado de la cita en `/es/dashboard` o `/es/bookings`.
6. Tras la cita (estado DONE), dejar una resena con 1-5 estrellas y
   comentario opcional.

### 11.2 Profesional

1. Recibir cuenta creada por admin con rol PROFESSIONAL.
2. Login y acceder a `/es/dashboard`.
3. **Configurar horario**: ir a "Mi Horario" (`/es/professional/schedule`),
   anadir franjas semanales (ej: Lunes 9:00-13:00) y periodos de ausencia.
4. **Gestionar citas**: en `/es/bookings` ver las solicitudes pendientes y
   confirmar / rechazar.
5. Tras la cita: marcar como completada (DONE).

### 11.3 Administrador

1. Login con cuenta ADMIN.
2. Acceder al backoffice en `/es/backoffice/dashboard`.
3. **KPIs**: ver volumen de reservas, alertas de pendientes >24h.
4. **Usuarios**: crear, modificar rol, desactivar, eliminar.
5. **Reservas**: supervisar todas las citas, cancelar con motivo.
6. **Servicios**: CRUD de catalogo, activar/desactivar.

---

## 12. Conclusiones y Trabajo Futuro

### 12.1 Objetivos cumplidos

- API REST completa, segura y documentada (Swagger).
- Frontend moderno con i18n, responsive y type-safe.
- Backoffice propio diferenciado del area de cliente/profesional.
- Seguridad multi-capa (argon2, axes, ratelimit, CSP, cifrado en BD).
- Sistema de resenas con moderacion.
- Despliegue funcional en https://neocoree.xyz.

### 12.2 Dificultades encontradas

- **Conflicto arquitectonico inicial**: el brief sugeria Django MTV pero
  el proyecto ya era Django REST + Next.js. Se opto por mantener la
  arquitectura desacoplada y reescribir el plan en consecuencia.
- **Bug de routing**: el matcher de `next-intl` interceptaba `/api/*` y lo
  redirigia a `/es/api/*`, rompiendo el rewrite proxy. Solucion: anadir
  `api` a la lista de exclusiones del matcher.
- **Acoplamiento entre apps**: `Review` vive en `apps.bookings` aunque
  conceptualmente es una entidad propia. Decision pragmatica para evitar
  imports circulares con `User`.

### 12.3 Mejoras futuras

- **Pasarela de pago** (Stripe Connect) para pagos al confirmar.
- **App movil** React Native consumiendo la misma API.
- **Videoconsulta** integrada (Daily.co o Twilio Video).
- **WebSockets** para notificar al profesional en tiempo real cuando un
  cliente solicita cita (Django Channels + Redis).
- **Calendario compartido** (CalDAV / Google Calendar API) para sincronizar
  el horario del profesional con su calendario personal.
- **Recomendador de profesional** basado en historial y rating.
- **Tests E2E** con Playwright contra produccion.

---

> Documento generado para el TFG NeoCore.
> Repositorio: https://github.com/Raullopez20/TFG_ADELANTADO
> Despliegue: https://neocoree.xyz
