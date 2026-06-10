# Guía de Despliegue en Producción - NeoCore

## 🚀 Opciones de Despliegue

1. **VPS/Servidor Dedicado** (Recomendado para TFG)
2. **AWS EC2 + RDS**
3. **DigitalOcean Droplet**
4. **Heroku**

Esta guía se centra en **VPS genérico** (aplicable a cualquier proveedor).

## 📋 Pre-requisitos

- Servidor Ubuntu 22.04 LTS (mínimo 2GB RAM, 2 vCPU)
- Dominio DNS apuntando al servidor (ej: neocore.tudominio.com)
- Acceso SSH root o sudo

## 🔧 Instalación Paso a Paso

### 1. Preparar el Servidor

```bash
# Conectar por SSH
ssh root@tu-servidor-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y git curl nginx certbot python3-certbot-nginx

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install -y docker-compose

# Crear usuario para la aplicación
adduser neocore
usermod -aG docker neocore
usermod -aG sudo neocore

# Cambiar a usuario neocore
su - neocore
```

### 2. Clonar y Configurar el Proyecto

```bash
# Clonar repositorio
cd /home/neocore
git clone https://github.com/tu-usuario/neocore.git
cd neocore

# Copiar y editar variables de entorno
cp .env.example .env
nano .env
```

### 3. Configurar Variables de Entorno de Producción

Edita `.env` con los siguientes valores:

```bash
# Django Settings
SECRET_KEY=genera-una-clave-super-secreta-de-50-caracteres-aleatorios
DEBUG=False
ALLOWED_HOSTS=neocore.tudominio.com,www.neocore.tudominio.com

# Database
POSTGRES_DB=neocore_prod
POSTGRES_USER=neocore_user
POSTGRES_PASSWORD=contraseña-super-segura-y-aleatoria
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Email SMTP (Gmail ejemplo)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password-de-google
DEFAULT_FROM_EMAIL=neocore@tudominio.com

# Frontend
NEXT_PUBLIC_API_URL=https://neocore.tudominio.com
NEXT_PUBLIC_SITE_URL=https://neocore.tudominio.com

# Security
CORS_ALLOWED_ORIGINS=https://neocore.tudominio.com,https://www.neocore.tudominio.com
CSRF_TRUSTED_ORIGINS=https://neocore.tudominio.com,https://www.neocore.tudominio.com

# OAuth (opcional)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### 4. Generar SECRET_KEY Segura

```bash
# Generar SECRET_KEY aleatoria
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 5. Construir y Lanzar Contenedores

```bash
# Construir imágenes
docker-compose build

# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 6. Ejecutar Migraciones e Inicializar

```bash
# Migraciones de base de datos
docker-compose exec web python manage.py migrate

# Crear superusuario
docker-compose exec web python manage.py createsuperuser

# Colectar archivos estáticos
docker-compose exec web python manage.py collectstatic --noinput

# (Opcional) Cargar datos de prueba
docker-compose exec web python manage.py seed_data
```

### 7. Configurar Nginx (Fuera de Docker)

Crear archivo de configuración en el host:

```bash
sudo nano /etc/nginx/sites-available/neocore
```

Contenido:

```nginx
server {
    listen 80;
    server_name neocore.tudominio.com www.neocore.tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name neocore.tudominio.com www.neocore.tudominio.com;

    # SSL certificates (se configuran con certbot)
    ssl_certificate /etc/letsencrypt/live/neocore.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neocore.tudominio.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 20M;

    # Proxy to Docker Nginx
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar sitio:

```bash
sudo ln -s /etc/nginx/sites-available/neocore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Configurar SSL con Let's Encrypt

```bash
# Obtener certificado SSL gratuito
sudo certbot --nginx -d neocore.tudominio.com -d www.neocore.tudominio.com

# Renovación automática (ya configurado por certbot)
sudo certbot renew --dry-run
```

### 9. Configurar Firewall

```bash
# Permitir SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔄 Actualizar la Aplicación

```bash
# Detener servicios
docker-compose down

# Obtener últimos cambios
git pull origin main

# Reconstruir si hay cambios en dependencias
docker-compose build

# Levantar servicios
docker-compose up -d

# Ejecutar migraciones
docker-compose exec web python manage.py migrate

# Colectar estáticos
docker-compose exec web python manage.py collectstatic --noinput

# Restart workers
docker-compose restart worker beat
```

## 💾 Backup y Restauración

### Backup de Base de Datos

```bash
# Crear backup
docker-compose exec db pg_dump -U neocore_user neocore_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Copiar backup a lugar seguro
scp backup_*.sql usuario@servidor-backup:/backups/
```

### Restaurar Base de Datos

```bash
# Restaurar desde backup
cat backup_20240115_120000.sql | docker-compose exec -T db psql -U neocore_user neocore_prod
```

### Script de Backup Automático

Crear `/home/neocore/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/neocore/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup DB
docker-compose -f /home/neocore/neocore/docker-compose.yml exec -T db \
    pg_dump -U neocore_user neocore_prod > $BACKUP_DIR/db_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/db_$DATE.sql

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
```

Hacer ejecutable y añadir a crontab:

```bash
chmod +x /home/neocore/backup.sh

# Añadir a crontab (backup diario a las 3 AM)
crontab -e
# Añadir línea:
0 3 * * * /home/neocore/backup.sh
```

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f web

# Solo workers de Celery
docker-compose logs -f worker beat
```

### Health Checks

```bash
# Verificar API
curl https://neocore.tudominio.com/api/health/

# Verificar servicios Docker
docker-compose ps
```

### Monitoreo de Recursos

```bash
# Stats de contenedores
docker stats

# Espacio en disco
df -h

# Memoria
free -h
```

## 🔐 Seguridad Adicional

### 1. Cambiar Puerto SSH

```bash
sudo nano /etc/ssh/sshd_config
# Cambiar Port 22 a Port 2222
sudo systemctl restart sshd
```

### 2. Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Actualizaciones Automáticas

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🚨 Troubleshooting

### Problema: Contenedores no arrancan

```bash
# Ver logs detallados
docker-compose logs web
docker-compose logs frontend

# Verificar .env
cat .env

# Reconstruir desde cero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problema: Error de base de datos

```bash
# Conectar a PostgreSQL
docker-compose exec db psql -U neocore_user neocore_prod

# Verificar conexión
\l
\dt
\q
```

### Problema: Nginx 502 Bad Gateway

```bash
# Verificar que servicios estén corriendo
docker-compose ps

# Verificar logs de nginx
sudo tail -f /var/log/nginx/error.log

# Verificar configuración
sudo nginx -t
```

### Problema: SSL no funciona

```bash
# Renovar certificados
sudo certbot renew --force-renewal

# Verificar permisos
sudo ls -la /etc/letsencrypt/live/neocore.tudominio.com/
```

## 📈 Optimizaciones de Producción

### 1. Incrementar Workers de Gunicorn

Editar `docker-compose.yml`:

```yaml
web:
  command: >
    sh -c "python manage.py migrate &&
           gunicorn neocore.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 2"
```

### 2. Configurar Redis como Cache

En `backend/neocore/settings.py` ya está configurado.

### 3. Habilitar Compresión Gzip

Ya está habilitado en `nginx/nginx.conf`.

## 📱 Configuración de App Password (Gmail)

1. Ir a https://myaccount.google.com/security
2. Activar verificación en 2 pasos
3. Ir a "App passwords"
4. Generar contraseña para "Mail"
5. Usar esa contraseña en `EMAIL_HOST_PASSWORD`

## ✅ Checklist Final de Despliegue

- [ ] Servidor configurado con Ubuntu 22.04
- [ ] Docker y Docker Compose instalados
- [ ] Dominio apuntando al servidor
- [ ] Variables de entorno configuradas (`.env`)
- [ ] SECRET_KEY generada y segura
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS configurado
- [ ] Contenedores levantados (`docker-compose up -d`)
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado
- [ ] SSL configurado con Let's Encrypt
- [ ] Nginx configurado y funcionando
- [ ] Firewall configurado
- [ ] Email SMTP configurado y probado
- [ ] Backups automáticos configurados
- [ ] Health checks funcionando

## 🎉 ¡Producción Lista!

Tu aplicación debería estar accesible en:
- https://neocore.tudominio.com

Para verificar:
1. Abre el navegador y visita tu dominio
2. Verifica que SSL funciona (candado verde)
3. Crea una cuenta de prueba
4. Intenta hacer una reserva
5. Verifica que lleguen los emails

---

**Soporte**: Para problemas, revisa los logs con `docker-compose logs -f`
