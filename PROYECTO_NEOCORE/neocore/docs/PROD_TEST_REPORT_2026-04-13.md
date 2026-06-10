# Informe de pruebas en entorno oficial

Fecha: 2026-04-13
Entorno objetivo: produccion oficial (internet)

## Alcance solicitado

- Registro de usuario
- Login
- Flujo cliente -> reserva
- Flujo profesional -> aceptacion de reserva
- Verificacion admin
- Pruebas de carga / volumen (incluyendo objetivo de 500 usuarios)
- Evidencia y documentacion de usuarios usados

## Resultado real de ejecucion hoy

### Disponibilidad de dominios

- https://neocoree.xyz -> HTTP 200
- https://www.neocoree.xyz -> HTTP 200
- https://api.neocoree.xyz -> HTTP 502
- https://api.neocoree.xyz/api/health/ -> HTTP 502
- https://api.neocoree.xyz/api/docs/ -> HTTP 502

Conclusión: el frontend publico responde, pero la API oficial esta caida por gateway (502). Por ello no se pueden ejecutar pruebas E2E de negocio contra produccion en este momento.

### Reejecucion automatica (misma fecha)

Se relanzo la comprobacion en produccion y se mantiene el mismo estado:
- `https://neocoree.xyz` -> `200`
- `https://api.neocoree.xyz/api/health/` -> `502`
- `https://api.neocoree.xyz/api/docs/` -> `502`

Tambien se ejecuto el script oficial de smoke (`scripts/prod_smoke_tests.ps1`) y fallo en el paso 1 (health) por `502`.

## Usuarios usados hoy

No se han podido crear usuarios en produccion debido a indisponibilidad de API (502).

## Evidencia tecnica

El health-check oficial devolvio 502 repetidamente. Sin API operativa no es posible validar:
- registro/login
- creacion y confirmacion de reservas
- panel admin por endpoints protegidos
- test de carga de usuarios

Ademas, el script `scripts/prod_smoke_tests.ps1` se ejecuto contra produccion y fallo en el primer paso:
- `GET https://api.neocoree.xyz/api/health/` -> `HTTP 502`

## Activos entregados para ejecutar pruebas en cuanto vuelva la API

Se ha dejado script automatizado de smoke + e2e + carga controlada:
- scripts/prod_smoke_tests.ps1

### Ejecucion recomendada (cuando API vuelva a 200)

```powershell
# Smoke cliente + reserva
./scripts/prod_smoke_tests.ps1 -ApiBaseUrl "https://api.neocoree.xyz"

# Smoke completo con profesional y admin
./scripts/prod_smoke_tests.ps1 \
  -ApiBaseUrl "https://api.neocoree.xyz" \
  -ProfessionalEmail "<email_profesional>" \
  -ProfessionalPassword "<password_profesional>" \
  -AdminEmail "<email_admin>" \
  -AdminPassword "<password_admin>"

# Carga controlada de registro (observando rate limit)
./scripts/prod_smoke_tests.ps1 -ApiBaseUrl "https://api.neocoree.xyz" -BulkRegisterAttempts 50
```

Nota: por seguridad, el endpoint de registro tiene rate limit. Intentar crear 500 usuarios por registro publico desde una sola IP debe devolver 429 en muchos intentos, lo cual es esperado y correcto.

## Recomendaciones para completar la validacion total en oficial

1. Recuperar API de produccion hasta `GET /api/health/ = 200`.
2. Ejecutar script de pruebas de smoke completo.
3. Ejecutar prueba de carga de registro de forma controlada (no destructiva).
4. Exportar salida JSON del script y adjuntarla a la memoria de pruebas.
5. Rotar o eliminar usuarios de QA creados en produccion tras la demo.

## Estado final de esta iteracion

- Pruebas oficiales de negocio: BLOQUEADAS por API 502.
- Preparacion para ejecutar pruebas completas en cuanto se recupere API: COMPLETA.
