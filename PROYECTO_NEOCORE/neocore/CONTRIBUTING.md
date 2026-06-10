# Contribuir a NeoCore

¡Gracias por tu interés en contribuir a NeoCore! 🎉

## 📋 Proceso de Contribución

1. **Fork** el repositorio
2. Crea una **rama** para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Haz tus **cambios** siguiendo las guías de estilo
4. Ejecuta los **tests**: `make test`
5. Ejecuta los **linters**: `make lint`
6. **Commit** tus cambios: `git commit -m 'Add: nueva funcionalidad'`
7. **Push** a tu fork: `git push origin feature/nueva-funcionalidad`
8. Abre un **Pull Request**

## 🎨 Estándares de Código

### Backend (Python)
- **Linter**: Ruff
- **Formatter**: Black
- **Línea máxima**: 100 caracteres
- **Docstrings**: Google style

```python
def mi_funcion(parametro: str) -> bool:
    """
    Descripción breve de la función.
    
    Args:
        parametro: Descripción del parámetro
        
    Returns:
        Descripción del valor de retorno
    """
    pass
```

### Frontend (TypeScript)
- **Linter**: ESLint
- **Formatter**: Prettier
- **Línea máxima**: 100 caracteres
- **Componentes**: PascalCase
- **Funciones**: camelCase

```typescript
interface Props {
  title: string;
  onSubmit: () => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  return <div>{title}</div>;
}
```

## 🧪 Tests

### Backend
```bash
# Ejecutar todos los tests
docker-compose exec web pytest

# Con cobertura
docker-compose exec web pytest --cov

# Solo un test
docker-compose exec web pytest apps/users/tests.py::test_user_creation
```

### Frontend
```bash
# Unit tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## 📝 Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: añadir nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactorizar código
test: añadir tests
chore: tareas de mantenimiento
```

Ejemplos:
```
feat(bookings): añadir filtro por fecha
fix(auth): corregir validación de email
docs(readme): actualizar guía de instalación
```

## 🔍 Code Review

Tu PR será revisado considerando:

- ✅ Tests pasando
- ✅ Linters sin errores
- ✅ Documentación actualizada
- ✅ Cambios claros y concisos
- ✅ Sin conflictos con `main`

## 🐛 Reportar Bugs

Usa el [issue template](https://github.com/tu-usuario/neocore/issues/new):

- **Descripción**: ¿Qué pasó?
- **Reproducir**: Pasos para reproducir
- **Esperado**: ¿Qué debería pasar?
- **Screenshots**: Si aplica
- **Entorno**: OS, versión, etc.

## 💡 Sugerir Features

Abre un issue con:

- **Problema**: ¿Qué problema resuelve?
- **Solución**: ¿Cómo lo harías?
- **Alternativas**: Otras opciones consideradas
- **Contexto**: Información adicional

## 📦 Áreas de Contribución

- **Backend**: Django, DRF, Celery
- **Frontend**: Next.js, React, UI/UX
- **DevOps**: Docker, CI/CD, Deploy
- **Docs**: README, guías, tutoriales
- **Tests**: Unit, integration, E2E
- **Traducciones**: i18n ES/EN

## ❓ Preguntas

Abre un [Discussion](https://github.com/tu-usuario/neocore/discussions) o contacta por email.

¡Gracias por contribuir! 🙏
