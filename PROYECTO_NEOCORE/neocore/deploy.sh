#!/bin/bash

# NeoCore Deployment Script
# Uso: ./deploy.sh [production|staging]

set -e

ENV=${1:-production}
echo "🚀 Desplegando NeoCore en modo: $ENV"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que existe .env
if [ ! -f .env ]; then
    log_error "Archivo .env no encontrado. Copia .env.example y configúralo."
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose no está instalado"
    exit 1
fi

# Hacer backup de la base de datos
log_info "Creando backup de base de datos..."
mkdir -p backups
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T db pg_dump -U neocore_user neocore_db > $BACKUP_FILE 2>/dev/null || log_warn "No se pudo hacer backup (¿primera instalación?)"

# Pull latest changes (si es un repositorio git)
if [ -d .git ]; then
    log_info "Obteniendo últimos cambios..."
    git pull origin main
fi

# Parar servicios
log_info "Deteniendo servicios..."
docker-compose down

# Construir imágenes
log_info "Construyendo imágenes Docker..."
docker-compose build

# Levantar servicios
log_info "Levantando servicios..."
docker-compose up -d

# Esperar a que la BD esté lista
log_info "Esperando a que PostgreSQL esté listo..."
until docker-compose exec -T db pg_isready -U neocore_user &> /dev/null; do
    echo -n "."
    sleep 1
done
echo ""

# Ejecutar migraciones
log_info "Ejecutando migraciones..."
docker-compose exec -T web python manage.py migrate

# Colectar archivos estáticos
log_info "Recolectando archivos estáticos..."
docker-compose exec -T web python manage.py collectstatic --noinput

# Reiniciar workers de Celery
log_info "Reiniciando workers de Celery..."
docker-compose restart worker beat

# Verificar que los servicios están corriendo
log_info "Verificando servicios..."
sleep 5

if docker-compose ps | grep -q "Up"; then
    log_info "✅ Despliegue completado exitosamente"
    echo ""
    echo "Servicios disponibles:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - API: http://localhost:8000"
    echo "  - Admin: http://localhost:8000/admin/"
    echo ""
    echo "Ver logs: docker-compose logs -f"
else
    log_error "❌ Algunos servicios no están corriendo"
    echo "Ejecuta 'docker-compose ps' para ver el estado"
    exit 1
fi

# Limpiar backups antiguos (más de 30 días)
log_info "Limpiando backups antiguos..."
find backups/ -name "backup_*.sql" -mtime +30 -delete 2>/dev/null || true

log_info "🎉 ¡Despliegue finalizado!"
