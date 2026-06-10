# Deploy NeoCore: Vercel monorepo + Neon PostgreSQL

## Arquitectura

Un solo proyecto Vercel sirve tanto el frontend (Next.js) como el backend (Django serverless):

- `neocoree.xyz` → Next.js (frontend)
- `neocoree.xyz/api/*` → Python serverless function (Django)
- Base de datos: Neon PostgreSQL (externa)

---

## 1) Variables de entorno en Vercel

Añade estas variables en Vercel → Settings → Environment Variables:

| Variable | Valor |
|---|---|
| `SECRET_KEY` | genera una clave larga y aleatoria |
| `DATABASE_URL` | tu URL de Neon `postgresql://...?sslmode=require` |
| `DEBUG` | `False` |
| `VERCEL` | `1` |
| `VERCEL_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | (dejar vacío — usa /api relativo) |

Opcionales:
| Variable | Valor |
|---|---|
| `REDIS_URL` | URL de Redis si tienes Celery activo |
| `EMAIL_HOST_PASSWORD` | contraseña SMTP para envío de correos |
| `FIELD_ENCRYPTION_KEY` | clave Fernet para campos cifrados |

---

## 2) Primer deploy

1. Haz push al repositorio — Vercel despliega automáticamente.
2. Las migraciones se ejecutan en el primer request gracias al arranque del WSGI.
3. Poblar datos de prueba (ver sección 3).

---

## 3) Seed de datos de prueba

Tras el primer deploy, ejecuta el comando de seed una única vez con las
variables de entorno de producción cargadas:

```bash
python manage.py seed_data
```

Esto crea el usuario administrador, profesionales y clientes de demo,
servicios, disponibilidades y reservas de ejemplo. Las contraseñas
generadas se muestran por consola; cámbialas inmediatamente en cualquier
entorno expuesto a internet.

---

## 4) DNS para `neocoree.xyz`

- `@` y `www` → registros que indica Vercel (A/ALIAS + CNAME)
- `api.neocoree.xyz` → CNAME a `cname.vercel-dns.com` (alias semántico del mismo proyecto)

---

## 5) Verificación

- `https://neocoree.xyz/api/health/` → `{"status": "ok"}`
- `https://neocoree.xyz/api/docs/` → Swagger UI
- `https://neocoree.xyz/` → Frontend Next.js

---

## 6) Checklist de seguridad

- `DEBUG=False` y `SECRET_KEY` larga y única
- `DATABASE_URL` con `sslmode=require` (Neon lo requiere)
- Cambiar las contraseñas de los usuarios de demo tras el seed
- Rotar `FIELD_ENCRYPTION_KEY` y `EMAIL_HOST_PASSWORD` si se compartieron en texto plano
