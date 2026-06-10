# NeoCore

Sistema integral de reservas para centros de salud y bienestar.

Stack principal:
- Backend: Django + DRF + JWT + Celery + Redis + PostgreSQL
- Frontend: Next.js (App Router) + TypeScript + Tailwind
- Infra: Docker Compose (local), despliegue Vercel monorepo (frontend + backend) + Neon PostgreSQL

## Estado actual

Proyecto funcional con:
- Roles: CLIENT, PROFESSIONAL, ADMIN
- Flujo de reservas completo
- Gestion de disponibilidad y ausencias
- Backoffice web
- Endpoint de contacto
- Medidas de seguridad activas (rate limit, CSRF, CORS, CSP, Axes)
- RGPD implementado:
  - GET /api/auth/users/me/export/
  - DELETE /api/auth/users/me/delete/ (requiere current_password)
- Acciones RGPD integradas en la pantalla de perfil (exportar datos y eliminar cuenta)

## Estructura recomendada

```text
neocore/
  backend/
    apps/
      users/
        tests/
      bookings/
        tests/
      availability/
        tests/
      services/
      notifications/
    neocore/
    requirements.txt
    pytest.ini
  frontend/
    src/
      app/
      components/
      lib/
      messages/
    tests/
      unit/
  docs/
    INDEX.md
    API.md
    ARCHITECTURE.md
    SECURITY.md
    DEPLOYMENT.md
    VERCEL_NEON_DEPLOY.md
```

## Requisitos

- Docker + Docker Compose
- Node.js 20+
- Python 3.11 o 3.12 recomendado para backend local

Nota: con Python 3.13 puede fallar instalacion de `psycopg2-binary` en algunos entornos Windows.

## Inicio rapido (Docker)

```bash
cp .env.example .env
docker-compose up -d --build
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
docker-compose exec web python manage.py seed_data
```

Accesos:
- Frontend: http://localhost:3000
- API: http://localhost:8000/api/
- Swagger: http://localhost:8000/api/docs/

## Desarrollo local por separado

Backend:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Testing

Backend (pytest):
```bash
cd backend
pytest
pytest --cov=apps --cov-report=html
```

Frontend (Jest):
```bash
cd frontend
npm test
```

E2E (Playwright):
```bash
cd frontend
npm run test:e2e
```

## Seguridad implementada

Backend:
- JWT con rotacion y blacklist de refresh tokens
- Rate limiting en login/registro/contacto
- django-axes para bloqueo de intentos
- Middleware anti SQL injection
- CSRF y CORS endurecidos
- Headers de seguridad y CSP
- Sanitizacion de entradas con bleach

Frontend:
- No persistencia de credenciales sensibles fuera de token JWT
- Reintento de token con refresh seguro
- Redireccion locale-aware al expirar sesion
- Cliente API robusto para internet (normalizacion de NEXT_PUBLIC_API_URL y timeout)
- Cabeceras de seguridad en Next.js (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)

## API externa y acceso por Internet

Para que API y frontend funcionen desde internet:

1. Despliegue (Vercel monorepo):
- Un solo proyecto Vercel sirve el frontend (Next.js) y el backend (Python serverless)
- Variables mínimas: SECRET_KEY, DATABASE_URL (Neon), VERCEL=1, VERCEL_ENV=production

2. Frontend:
- Desplegado automáticamente como parte del mismo proyecto Vercel
- Variable `NEXT_PUBLIC_API_URL=https://api.tudominio.com`
- En local, se puede usar `BACKEND_API_URL` para rewrites

3. DNS y HTTPS:
- Frontend: tudominio.com -> Vercel
- API: api.tudominio.com -> proveedor backend
- Certificados SSL activos

4. Verificacion final:
- GET /api/health/
- Login desde frontend publicado
- Crear reserva end-to-end

## Documentacion

Ver indice central:
- docs/INDEX.md

Documentos clave:
- docs/API.md
- docs/ARCHITECTURE.md
- docs/SECURITY.md
- docs/DEPLOYMENT.md
- docs/VERCEL_NEON_DEPLOY.md

## Comandos utiles

```bash
make up
make down
make logs
make migrate
make seed
make test
make lint
```

## Nota de despliegue

No se pueden ejecutar despliegues reales desde este chat sin credenciales/tokens del proveedor. El codigo y la documentacion quedan preparados para despliegue reproducible en Vercel + backend publico.
