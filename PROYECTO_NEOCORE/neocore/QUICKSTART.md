# 🚀 Quick Start - NeoCore

## Lanzar en 5 Minutos

```bash
# 1. Navegar al proyecto
cd neocore

# 2. Copiar .env
cp .env.example .env

# 3. Levantar servicios (primera vez tarda ~3min)
docker-compose up -d

# 4. Migraciones
docker-compose exec web python manage.py migrate

# 5. Crear admin
docker-compose exec web python manage.py createsuperuser

# 6. Datos de prueba (RECOMENDADO)
docker-compose exec web python manage.py seed_data

# 7. ¡Listo! Abre:
# - Frontend: http://localhost:3000
# - Admin: http://localhost:8000/admin/
# - API: http://localhost:8000/api/docs/
```

## Usuarios de Prueba (tras seed_data)

| Email | Password | Rol |
|-------|----------|-----|
| admin@neocore.com | admin123 | Admin |
| maria.garcia@neocore.com | professional123 | Fisioterapeuta |
| juan.lopez@neocore.com | professional123 | Nutricionista |
| pedro.sanchez@example.com | client123 | Cliente |

## Comandos Rápidos

```bash
make up          # Levantar
make down        # Parar
make logs        # Ver logs
make test        # Tests
make shell       # Django shell
```

## Problemas Comunes

### "Cannot connect to database"
```bash
docker-compose down
docker-compose up -d
# Esperar 30s
docker-compose exec web python manage.py migrate
```

### "Port already in use"
```bash
# Cambiar puertos en docker-compose.yml
# 3000:3000 -> 3001:3000
# 8000:8000 -> 8001:8000
```

## Siguiente Paso

Lee el [README.md](README.md) completo para más información.
