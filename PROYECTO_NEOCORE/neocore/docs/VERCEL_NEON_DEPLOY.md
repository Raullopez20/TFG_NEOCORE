# Deploy NeoCore: Vercel + Neon (dominio `neocoree.xyz`)

## 0) Seguridad (haz esto primero)
Has compartido credenciales de Neon en texto plano. **Rota la contraseña/connection string en Neon antes del deploy** y usa la nueva en variables de entorno.

---

## 1) Arquitectura recomendada
- **Frontend (Next.js)**: Vercel
- **Backend (Django)**: Railway (o Render/Fly)
- **Base de datos**: Neon PostgreSQL
- **Dominio**:
  - `neocoree.xyz` y `www.neocoree.xyz` → Vercel
  - `api.neocoree.xyz` → Backend (Railway)

> Nota: este proyecto Django no está preparado para ejecutarse completo en Vercel Serverless tal como está.

---

## 2) Backend (Railway) conectado a Neon

### 2.1 Crear servicio backend
- Nuevo proyecto en Railway desde tu repo GitHub.
- Selecciona carpeta/servicio de backend (`backend/`) usando su `Dockerfile`.

### 2.2 Variables de entorno backend (Railway)
Configura estas variables en Railway:

- `DEBUG=False`
- `SECRET_KEY=<genera-una-clave-segura>`
- `DATABASE_URL=<tu-url-pooled-de-neon-con-sslmode=require>`
- `ALLOWED_HOSTS=api.neocoree.xyz,<tu-subdominio-railway>`
- `CORS_ALLOWED_ORIGINS=https://neocoree.xyz,https://www.neocoree.xyz`
- `CSRF_TRUSTED_ORIGINS=https://neocoree.xyz,https://www.neocoree.xyz,https://api.neocoree.xyz`
- `NEXT_PUBLIC_API_URL=https://api.neocoree.xyz`
- `NEXT_PUBLIC_DOMAIN=https://neocoree.xyz`

Opcional/recomendado para tareas y caché:
- `REDIS_URL=<url-redis>`
- `CELERY_BROKER_URL=<url-redis>`
- `CELERY_RESULT_BACKEND=<url-redis>`

### 2.3 Migraciones y superusuario
En Railway CLI o shell del servicio:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_data
```

### 2.4 Verificación backend
- `https://api.neocoree.xyz/api/health/`
- `https://api.neocoree.xyz/api/docs/`

---

## 3) Frontend (Vercel)

### 3.1 Importar proyecto
- En Vercel, importa el repo.
- **Root Directory**: `frontend`
- Framework detectado: Next.js

### 3.2 Variables de entorno frontend (Vercel)
- `NEXT_PUBLIC_API_URL=https://api.neocoree.xyz`
- `NEXT_PUBLIC_DOMAIN=https://neocoree.xyz`

(Agregar en `Production`, `Preview` y `Development` según necesites)

### 3.3 Deploy
- Ejecuta deploy desde Vercel dashboard.
- Comprueba que la web carga y hace llamadas a `api.neocoree.xyz`.

---

## 4) DNS para `neocoree.xyz`

### 4.1 Dominio principal a Vercel
En el panel DNS de tu dominio:
- `@` → registros según te indique Vercel (normalmente A/ALIAS)
- `www` → CNAME a `cname.vercel-dns.com`

### 4.2 Subdominio API al backend
- `api` → CNAME al dominio público del servicio backend (Railway)

---

## 5) Checklist final
- Frontend responde en `https://neocoree.xyz`
- API responde en `https://api.neocoree.xyz/api/health/`
- Login funciona desde frontend
- Admin abre en `https://api.neocoree.xyz/admin/`
- `DEBUG=False` y `SECRET_KEY` segura
- Credenciales de Neon rotadas
