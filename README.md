# 🏥 NeoCore — Sistema Integral de Reservas de Salud y Bienestar

<div align="center">

[![Deploy Status](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://neocoree.xyz)
[![Backend](https://img.shields.io/badge/backend-Django%204.2-092E20?logo=django)](https://djangoproject.com)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-black?logo=next.js)](https://nextjs.org)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20(Neon)-336791?logo=postgresql)](https://neon.tech)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**🌐 Demo en producción: [neocoree.xyz](https://neocoree.xyz)**  
**📚 API Docs: [neocoree.xyz/api/docs](https://neocoree.xyz/api/docs)**

</div>

---

## 📋 Índice

- [Descripción](#descripción)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Desarrollo Local](#instalación-y-desarrollo-local)
- [Variables de Entorno](#variables-de-entorno)
- [API Reference](#api-reference)
- [Roles y Permisos](#roles-y-permisos)
- [Seguridad](#seguridad)
- [Despliegue en Producción](#despliegue-en-producción)
- [Testing](#testing)

---

## 📖 Descripción

**NeoCore** es un sistema integral de gestión de reservas y citas para centros de salud y bienestar, desarrollado como Trabajo de Fin de Grado (TFG) del ciclo superior de **Desarrollo de Aplicaciones Web (DAW)**.

El sistema permite a los **clientes** reservar citas con **profesionales** (fisioterapeutas, nutricionistas, psicólogos, etc.), y a los **administradores** gestionar todo el centro desde un backoffice dedicado con estadísticas en tiempo real, gestión de usuarios, servicios y disponibilidad horaria.

### ¿Qué problema resuelve?

Los centros de salud y bienestar tradicionales gestionan las citas mediante llamadas telefónicas o sistemas anticuados. NeoCore digitaliza completamente este proceso, ofreciendo:

- **Reserva online 24/7** sin necesidad de llamar
- **Gestión de disponibilidad** en tiempo real para cada profesional  
- **Notificaciones automáticas** por email en cada cambio de estado
- **Panel administrativo** completo con métricas y gestión de usuarios

---

## ✨ Características

### Para Clientes
- 🔐 Registro y autenticación segura con JWT
- 📅 Reserva de citas en 4 pasos intuitivos (wizard)
- ⏰ Visualización de slots disponibles en tiempo real
- 📊 Historial de reservas con filtros
- 👤 Perfil personalizable con foto
- 🔑 Recuperación de contraseña por email real (Resend)

### Para Profesionales
- 📋 Panel de citas propias con confirmar/rechazar/completar
- 🕐 Gestión de horario semanal (días y horarios)
- 👥 Visualización de datos del cliente (nombre, email, teléfono)
- 🔔 Notificaciones email automáticas

### Para Administradores
- 🎛️ Backoffice completo con dashboard de métricas
- 👥 Gestión de usuarios (roles, altas, bajas)
- 💼 Gestión de profesionales con fotos y horarios
- 🛠️ Gestión de servicios con imágenes
- 📈 Estadísticas con selector de período (7/30/90/365 días)
- 🔌 Panel de API Reference con prueba integrada
- 📚 Swagger UI interactivo en `/api/docs`

### Sistema
- 🌍 Soporte multiidioma (español/inglés) con next-intl
- 📱 Diseño responsive (Mobile First)
- 🔒 Seguridad robusta (CSP, CORS, AXES, JWT, Argon2)
- 📧 Emails transaccionales con plantillas HTML personalizadas
- ☁️ Almacenamiento de imágenes en Cloudinary
- 🐘 PostgreSQL en Neon (serverless PostgreSQL)
- 🚀 Desplegado en Vercel (serverless)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                         │
│                    neocoree.xyz (HTTPS)                           │
└────────────────────────┬───────────────────────────────────────-─┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL CDN / Edge Network                      │
│                                                                   │
│  ┌─────────────────────┐    ┌────────────────────────────────┐  │
│  │   Next.js Frontend  │    │   Django API (Serverless)       │  │
│  │   (Static + SSR)    │    │   api/index.py (WSGI)           │  │
│  │                     │    │                                  │  │
│  │  /es/*              │    │  /api/*  /admin/*  /media/*      │  │
│  │  /en/*              │    │                                  │  │
│  └─────────────────────┘    └──────────────┬───────────────-──┘  │
└────────────────────────────────────────────│─────────────────────┘
                                             │
                         ┌───────────────────┼────────────────┐
                         │                   │                │
                         ▼                   ▼                ▼
              ┌──────────────────┐  ┌───────────┐  ┌────────────────┐
              │  Neon PostgreSQL │  │  Resend   │  │   Cloudinary   │
              │  (Serverless DB) │  │  (Email)  │  │   (Imágenes)   │
              └──────────────────┘  └───────────┘  └────────────────┘
```

### Flujo de Petición

1. **Petición del browser** → Vercel CDN
2. **Si `/es/*` o `/en/*`** → Next.js (SSR + Client)
3. **Si `/api/*`** → Rewrite a `api/index.py` (Django WSGI serverless)
4. **Si `/media/*`** → Django sirve la imagen desde Cloudinary o `/tmp/media`
5. **Django** procesa, consulta **Neon PostgreSQL** y devuelve respuesta JSON

### Cold Start en Vercel

```python
# api/index.py — Entrada WSGI de Vercel
# En cada cold start (nueva instancia serverless):
1. django.setup()           # Inicializa Django
2. migrate --run-syncdb     # Aplica migraciones pendientes (idempotente)
3. get_wsgi_application()   # Retorna la app WSGI
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión | Uso |
|------|-----------|---------|-----|
| **Backend** | Django | 4.2.9 | Framework web Python |
| **Backend** | Django REST Framework | 3.14 | API REST |
| **Backend** | dj-rest-auth + djoser | 5.0.2 / 2.3.1 | Auth endpoints |
| **Backend** | djangorestframework-simplejwt | 5.3.1 | Tokens JWT |
| **Backend** | django-allauth | 0.60.1 | Auth social y cuentas |
| **Backend** | django-axes | 6.5.1 | Protección fuerza bruta |
| **Backend** | drf-spectacular | 0.27.0 | Swagger / OpenAPI |
| **Backend** | Gunicorn | 21.2.0 | WSGI server (Docker) |
| **Frontend** | Next.js | 16.2.1 | React framework (App Router) |
| **Frontend** | TypeScript | 5.3.3 | Tipado estático |
| **Frontend** | Tailwind CSS | 3.4.0 | Estilos utility-first |
| **Frontend** | Radix UI | Latest | Componentes accesibles |
| **Frontend** | next-intl | 4.8.3 | Internacionalización |
| **Frontend** | Axios | 1.6.5 | Cliente HTTP |
| **Frontend** | React Query | 5.17 | Estado del servidor |
| **Base de datos** | PostgreSQL (Neon) | 15 | DB principal serverless |
| **Caché** | Redis | 5.0.1 | Broker Celery (opcional) |
| **Email** | Resend + anymail | 10.3 | Emails transaccionales |
| **Imágenes** | Cloudinary | 1.36+ | CDN de imágenes |
| **Despliegue** | Vercel | - | Hosting serverless |
| **CI/CD** | GitHub Actions | - | Pipeline automático |

---

## 📁 Estructura del Proyecto

```
TFG_ADELANTADO/
├── api/
│   └── index.py              # Entrada WSGI para Vercel (serverless)
├── PROYECTO_NEOCORE/neocore/
│   ├── backend/
│   │   ├── apps/
│   │   │   ├── users/        # Gestión de usuarios y autenticación
│   │   │   │   ├── models.py            # Modelo User personalizado
│   │   │   │   ├── serializers.py       # Serializers + validaciones
│   │   │   │   ├── views.py             # UserViewSet con CRUD
│   │   │   │   ├── security_views.py    # Login/Register/Logout seguros
│   │   │   │   ├── permissions.py       # IsAdmin, IsOwnerOrAdmin
│   │   │   │   ├── signals.py           # Señales de seguridad
│   │   │   │   └── management/commands/
│   │   │   │       └── seed_data.py     # Comando seed realista
│   │   │   ├── services/     # Catálogo de servicios
│   │   │   │   ├── models.py
│   │   │   │   ├── serializers.py
│   │   │   │   └── views.py
│   │   │   ├── bookings/     # Sistema de reservas y citas
│   │   │   │   ├── models.py            # Booking + Review
│   │   │   │   ├── serializers.py
│   │   │   │   ├── views.py             # BookingViewSet + stats
│   │   │   │   └── signals.py           # Notificaciones post-save
│   │   │   ├── availability/ # Disponibilidad horaria
│   │   │   │   ├── models.py            # AvailabilityRule + TimeOff
│   │   │   │   ├── serializers.py
│   │   │   │   ├── views.py
│   │   │   │   └── services.py          # Lógica de slots disponibles
│   │   │   └── notifications/ # Emails de notificación
│   │   │       ├── models.py            # NotificationLog
│   │   │       ├── views.py             # Formulario de contacto
│   │   │       └── tasks.py             # Tareas Celery (email async)
│   │   ├── neocore/
│   │   │   ├── settings.py   # Configuración central (250+ líneas)
│   │   │   ├── urls.py       # Enrutamiento raíz
│   │   │   ├── middleware.py # Middlewares de seguridad custom
│   │   │   └── wsgi.py       # WSGI para Docker/producción
│   │   ├── templates/
│   │   │   └── account/email/ # Plantillas HTML de emails
│   │   │       ├── password_reset_key.html
│   │   │       └── password_reset_key_subject.txt
│   │   └── requirements.txt
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── [locale]/
│       │   │   │   ├── layout.tsx           # Layout con Navbar + Footer
│       │   │   │   ├── page.tsx             # Home page
│       │   │   │   ├── login/page.tsx       # Login con JWT
│       │   │   │   ├── register/page.tsx    # Registro con GDPR
│       │   │   │   ├── profile/page.tsx     # Perfil con foto
│       │   │   │   ├── services/            # Catálogo público
│       │   │   │   ├── professionals/       # Listado público
│       │   │   │   ├── booking/new/         # Wizard de reserva (4 pasos)
│       │   │   │   ├── bookings/            # Mis reservas
│       │   │   │   ├── dashboard/           # Dashboard por rol
│       │   │   │   ├── professional/        # Portal del profesional
│       │   │   │   ├── backoffice/          # Panel de administración
│       │   │   │   │   ├── dashboard/       # KPIs + acciones rápidas
│       │   │   │   │   ├── users/           # CRUD usuarios
│       │   │   │   │   ├── professionals/   # Gestión profesionales
│       │   │   │   │   ├── services/        # CRUD servicios
│       │   │   │   │   ├── bookings/        # Todas las reservas
│       │   │   │   │   ├── stats/           # Estadísticas detalladas
│       │   │   │   │   └── api/             # Panel API Reference
│       │   │   │   ├── forgot-password/     # Recuperar contraseña
│       │   │   │   ├── reset-password/      # Confirmar nueva contraseña
│       │   │   │   ├── privacy/page.tsx     # Política de privacidad
│       │   │   │   ├── terms/page.tsx       # Términos y condiciones
│       │   │   │   └── cookies/page.tsx     # Política de cookies
│       │   │   ├── not-found.tsx            # 404 global
│       │   │   └── global-error.tsx         # Error crítico global
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── navbar.tsx           # Navegación principal
│       │   │   │   └── footer.tsx           # Footer completo
│       │   │   ├── ui/                      # Componentes Radix UI
│       │   │   └── providers/               # React Query Provider
│       │   ├── lib/
│       │   │   └── api.ts                   # Axios + interceptores JWT
│       │   ├── i18n/
│       │   │   ├── routing.ts               # Configuración locales
│       │   │   └── request.ts
│       │   └── messages/
│       │       ├── es.json                  # Traducciones español
│       │       └── en.json                  # Traducciones inglés
│       └── middleware.ts                    # next-intl middleware
├── vercel.json                              # Config Vercel (rewrites, headers)
├── README.md                                # Este archivo
└── TFG_DOCUMENTACION.pdf                    # Documentación académica
```

---

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose (recomendado)
- PostgreSQL 15+ (o usar Docker)

### Opción 1: Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Raullopez20/TFG_ADELANTADO.git
cd TFG_ADELANTADO/PROYECTO_NEOCORE/neocore

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar servicios
make up
# o: docker-compose up -d

# 4. Aplicar migraciones y seed de datos
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py seed_data

# 5. Crear superusuario (opcional, el seed ya crea admin@neocore.com)
docker-compose exec backend python manage.py createsuperuser

# Acceso:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Swagger: http://localhost:8000/api/docs/
# Admin: http://localhost:8000/<ADMIN_PATH>/  (definido en la variable ADMIN_PATH)
```

### Opción 2: Sin Docker

```bash
# === BACKEND ===
cd PROYECTO_NEOCORE/neocore/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Variables de entorno
cp ../.env.example ../.env
export $(cat ../.env | xargs)

python manage.py migrate
python manage.py seed_data  # Datos de prueba
python manage.py runserver

# === FRONTEND (nueva terminal) ===
cd PROYECTO_NEOCORE/neocore/frontend
npm install
npm run dev
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en `PROYECTO_NEOCORE/neocore/`:

```env
# ── Django Core ──────────────────────────────────────────────────────
SECRET_KEY=django-insecure-cambia-esto-en-produccion-xxxxxxxxxxxxxxxx
DEBUG=True
LANGUAGE_CODE=es
TIME_ZONE=Europe/Madrid

# ── Base de datos ────────────────────────────────────────────────────
# Opción 1: URL completa (recomendado para Neon/producción)
DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require

# Opción 2: Variables individuales (desarrollo local con Docker)
POSTGRES_DB=neocore
POSTGRES_USER=neocore
POSTGRES_PASSWORD=neocore_dev_password
POSTGRES_HOST=db
POSTGRES_PORT=5432

# ── Hosts permitidos ─────────────────────────────────────────────────
ALLOWED_HOSTS=localhost,127.0.0.1,neocoree.xyz
ADMIN_ALLOWED_IPS=127.0.0.1

# ── Panel de administración (URL no obvia) ───────────────────────────
ADMIN_PATH=tu-ruta-admin-secreta/

# ── Email (Resend) ───────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=NeoCore <onboarding@resend.dev>
CONTACT_RECIPIENT_EMAIL=tu@email.com

# ── Almacenamiento de imágenes (Cloudinary) ──────────────────────────
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# ── Caché y tareas asíncronas (opcional) ─────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ── Seguridad ─────────────────────────────────────────────────────────
FIELD_ENCRYPTION_KEY=  # Fernet key para encriptar campos sensibles
                       # Si vacío, se deriva de SECRET_KEY automáticamente

# ── Vercel (solo en producción) ───────────────────────────────────────
VERCEL=1               # Activa configuración serverless
FRONTEND_URL=https://neocoree.xyz
```

### Variables mínimas para producción en Vercel

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `SECRET_KEY` | Clave secreta Django (aleatoria, larga) | ✅ |
| `DATABASE_URL` | Conexión PostgreSQL Neon | ✅ |
| `DEBUG` | `False` en producción | ✅ |
| `VERCEL` | `1` para activar modo serverless | ✅ |
| `RESEND_API_KEY` | Para envío de emails reales | Recomendada |
| `CLOUDINARY_URL` | Para imágenes permanentes | Recomendada |

---

## 🔌 API Reference

### Autenticación

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <access_token>
```

Obtén el token con:
```bash
curl -X POST https://neocoree.xyz/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tupassword"}'
```

Respuesta:
```json
{
  "access": "eyJhbGci...",   // Válido 15 minutos
  "refresh": "eyJhbGci...",  // Válido 7 días
  "user": { "id": 1, "email": "...", "role": "CLIENT", ... }
}
```

### Endpoints principales

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register/` | Público | Registro de usuario |
| `POST` | `/api/auth/login/` | Público | Obtener JWT tokens |
| `POST` | `/api/token/refresh/` | Público | Renovar access token |
| `GET` | `/api/auth/users/me/` | Bearer | Perfil del usuario |
| `GET` | `/api/auth/users/professionals/` | Público | Lista de profesionales |
| `GET` | `/api/services/` | Público | Catálogo de servicios |
| `GET` | `/api/availability/slots/get_slots/` | Público | Slots disponibles |
| `POST` | `/api/bookings/` | Cliente | Crear reserva |
| `GET` | `/api/bookings/` | Bearer | Mis reservas |
| `POST` | `/api/bookings/{id}/confirm/` | Profesional | Confirmar reserva |
| `POST` | `/api/bookings/{id}/reject/` | Profesional | Rechazar reserva |
| `GET` | `/api/bookings/stats/` | Admin | Estadísticas globales |
| `POST` | `/api/contact/` | Público | Formulario de contacto |
| `GET` | `/api/health/` | Público | Estado del sistema |
| `GET` | `/api/docs/` | Público | Swagger UI |
| `GET` | `/api/schema/` | Público | OpenAPI JSON/YAML |

Ver documentación completa en **[neocoree.xyz/api/docs](https://neocoree.xyz/api/docs)**

---

## 👥 Roles y Permisos

```
CLIENT (Cliente)
├── Crear reservas
├── Ver sus propias reservas
├── Cancelar sus reservas (PENDING o CONFIRMED)
├── Editar su perfil y foto
└── Dejar reseñas (si la cita está DONE)

PROFESSIONAL (Profesional)
├── Ver las reservas donde es el profesional asignado
├── Confirmar reservas PENDING
├── Rechazar reservas PENDING
├── Marcar reservas CONFIRMED como DONE
├── Gestionar su horario semanal
├── Gestionar ausencias (TimeOff)
└── Editar su perfil, foto y especialidad

ADMIN (Administrador)
├── Todo lo anterior
├── Ver TODAS las reservas del sistema
├── Gestionar todos los usuarios (crear, editar, rol, dar de baja)
├── Gestionar servicios (crear, editar, imagen, activar/desactivar)
├── Gestionar profesionales desde backoffice
├── Ver estadísticas globales
└── Acceder al backoffice completo
```

---

## 🔒 Seguridad

### Medidas implementadas

| Capa | Medida | Detalle |
|------|--------|---------|
| **Autenticación** | JWT RS256 | Access 15 min + Refresh 7 días con rotación |
| **Contraseñas** | Argon2 | Hash resistente a fuerza bruta (RFC 9106) |
| **Fuerza bruta** | django-axes | 5 intentos → bloqueo 15 min por IP+usuario |
| **Rate limiting** | DRF Throttle | 60 req/h anón, 500 req/h autenticado |
| **SQL Injection** | Regex middleware | Bloqueo de patrones SQL en query y body |
| **XSS** | Bleach | Sanitización HTML en campos de texto |
| **CSP** | django-csp | Política restrictiva de scripts/estilos |
| **HTTPS** | Vercel + HSTS | HSTS preload 1 año |
| **CORS** | Lista blanca | Solo orígenes específicos permitidos |
| **Encriptación** | Fernet | Teléfono, bio y notas de cita encriptados en DB |
| **Admin** | Honeypot + IP | `/admin/` es trampa, admin real en ruta oculta |
| **CSRF** | Cookies SameSite | Protección en formularios |

### Middlewares de seguridad custom

```
1. TrailingSlashMiddleware     → Compatibilidad Vercel/Django sin redirects
2. SecurityAnalysisMiddleware  → Análisis de UA maliciosos, rate limiting por IP
3. SQLInjectionProtectionMiddleware → Bloqueo de patrones SQL injection
4. AdminIPRestrictionMiddleware → Whitelist de IPs para el admin real
```

---

## 🚀 Despliegue en Producción

### Vercel (producción actual)

```bash
# Vercel detecta automáticamente el proyecto desde vercel.json
# Solo necesitas:
# 1. Conectar el repo a Vercel
# 2. Configurar variables de entorno (ver sección Variables)
# 3. Push a main → despliegue automático
```

**Arquitectura serverless en Vercel:**
- `vercel.json` configura rewrites: `/api/*` → `api/index.py` (Django)
- Next.js se despliega como funciones serverless + CDN
- Django se despliega como función Python serverless (1024MB, 30s timeout)
- Las migraciones se ejecutan en cada cold start (idempotente)

### Seeding de datos de demo

```bash
python manage.py seed_data
```

Crea: 1 admin, 18 profesionales, 220+ clientes, 21 servicios, 80 reservas.

### Docker (alternativa)

```bash
cd PROYECTO_NEOCORE/neocore
make up          # Inicia todos los servicios
make logs        # Ver logs en tiempo real
make down        # Parar servicios
```

**Credenciales de demo (solo entorno local, tras seed):**
```
Admin:         admin@neocore.com / Admin.Demo.1234
Profesional:   maria.garcia.fisio@neocore.com / Prof.Demo.1234
Cliente:       (generados automáticamente) / Client.Demo.1234
```

---

## 🧪 Testing

```bash
# Backend (desde backend/)
pytest                        # Todos los tests
pytest apps/users/            # Tests de una app específica
pytest -m unit                # Tests unitarios
pytest -m integration         # Tests de integración
pytest --cov=apps --cov-report=html  # Con coverage

# Frontend (desde frontend/)
npm test                      # Jest tests
npm run e2e                   # Playwright E2E tests

# Lint y formato
ruff check .                  # Linting Python
ruff format .                 # Formato Python
```

---

## 📞 Endpoints de Estado

```bash
# Health check
curl https://neocoree.xyz/api/health/
# → {"status": "ok"}

# Schema OpenAPI
curl https://neocoree.xyz/api/schema/
# → openapi: 3.0.3 ...

# Swagger UI (navegador)
https://neocoree.xyz/api/docs/
```

---

## 👨‍💻 Autor

**Raúl López** — Estudiante de DAW (Desarrollo de Aplicaciones Web)
- 📧 raullopez20r@gmail.com
- 🌐 [neocoree.xyz](https://neocoree.xyz)
- 💻 [GitHub](https://github.com/Raullopez20)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  <strong>NeoCore — TFG DAW 2026</strong><br>
  Hecho con ❤️ usando Django + Next.js
</div>
