# Testing en NeoCore

## Objetivo

Validar backend y frontend antes de despliegue, garantizando calidad minima para entrega academica y produccion.

## Estructura de tests

Backend:
- apps/users/tests/
- apps/bookings/tests/
- apps/availability/tests/

Frontend:
- frontend/tests/unit/
- frontend/tests/e2e/ (recomendado)

## Comandos

Backend:
```bash
cd backend
pytest
pytest --cov=apps --cov-report=html
```

Frontend:
```bash
cd frontend
npm test
npm run test:e2e
```

## Criterio recomendado

- Sin tests rotos en rama principal.
- Cobertura backend >= 70% para defensa.
- Al menos 1 flujo E2E critico (login -> reserva -> confirmacion).

## Casos criticos sugeridos

- Registro/login con bloqueo por intentos.
- Exportacion y borrado de cuenta RGPD.
- Creacion de reserva con control de disponibilidad.
- Restriccion de reseñas a citas DONE.
- Contacto con rate limit y validacion.
