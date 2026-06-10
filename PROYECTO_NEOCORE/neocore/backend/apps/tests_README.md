# Estructura de tests backend

Los tests se organizan por app en subcarpetas `tests/`.

- apps/users/tests/
- apps/services/tests/
- apps/bookings/tests/
- apps/availability/tests/
- apps/notifications/tests/

## Convenciones
- Nombres de archivo: `test_*.py`
- Clases: `*Tests`
- Metodos: `test_*`

## Ejecucion
- Todos: `pytest`
- Solo una app: `pytest apps/users/tests`
- Cobertura: `pytest --cov=apps --cov-report=html`
