# Production Checklist

Checklist para dejar NeoCore operativo en internet.

## Backend

- Configurar variables:
  - SECRET_KEY
  - DATABASE_URL
  - ALLOWED_HOSTS
  - CORS_ALLOWED_ORIGINS
  - CSRF_TRUSTED_ORIGINS
  - BACKEND_PUBLIC_URL
- Ejecutar migraciones.
- Crear superusuario.
- Verificar /api/health/ y /api/docs/.
- Verificar logs de seguridad (rate limit, axes, errores).

## Frontend (Vercel)

- Configurar:
  - NEXT_PUBLIC_API_URL=https://api.tudominio.com
  - NEXT_PUBLIC_DOMAIN=https://tudominio.com
- Opcional local: BACKEND_API_URL=http://localhost:8000
- Confirmar que rutas /api/* no son capturadas por middleware i18n.
- Validar login, reservas y backoffice desde dominio final.

## DNS y TLS

- Dominio frontend apuntando a Vercel.
- Subdominio API apuntando al proveedor backend.
- Certificados TLS validos en ambos.

## Pruebas post deploy

- Registro y login.
- Reserva completa (crear, confirmar, completar, reseña).
- Endpoint RGPD export/delete.
- Flujo RGPD desde perfil web (descarga de JSON y baja de cuenta con contraseña).
- Formulario contacto.
- Pruebas de rol (CLIENT/PROFESSIONAL/ADMIN).
