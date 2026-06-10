# Guía de Seguridad - NeoCore

## 🔒 Medidas de Seguridad Implementadas

### 1. Autenticación y Autorización

#### JWT Tokens
- **Access tokens**: Expiración de 1 hora
- **Refresh tokens**: Expiración de 7 días con rotación automática
- **Blacklist**: Tokens revocados almacenados en Redis

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

#### OAuth 2.0 (Google)
- Integración segura con django-allauth
- Client ID y Secret en variables de entorno
- Scope limitado: `profile` y `email`

#### Permisos Basados en Roles
```python
class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_client

class IsProfessional(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_professional

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin_role
```

### 2. Protección Contra Ataques

#### CSRF (Cross-Site Request Forgery)
- CSRF tokens en todas las peticiones POST/PUT/DELETE
- `CSRF_TRUSTED_ORIGINS` configurado para frontend

```python
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'https://neocore.tudominio.com'
]
```

#### CORS (Cross-Origin Resource Sharing)
- Orígenes permitidos explícitamente definidos
- Credentials habilitadas para cookies

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://neocore.tudominio.com'
]
CORS_ALLOW_CREDENTIALS = True
```

#### SQL Injection
- **Protección automática** mediante Django ORM
- Nunca concatenar SQL directamente
- Uso de prepared statements

#### XSS (Cross-Site Scripting)
- **Escapado automático** en templates de Django
- Content Security Policy headers (recomendado añadir)
- Sanitización de input en frontend

#### Clickjacking
```python
X_FRAME_OPTIONS = 'DENY'
```

### 3. Rate Limiting

Límites configurados por tipo de usuario y endpoint:

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',      # Usuarios anónimos
        'user': '1000/hour',     # Usuarios autenticados
        'booking': '10/minute',  # Endpoint de reservas
    }
}
```

#### Endpoints Críticos
- **POST /api/bookings/**: 10 req/min por usuario
- **POST /api/auth/login/**: 5 intentos/min (recomendado añadir)

### 4. Validación de Datos

#### Backend (Django)
```python
class BookingCreateSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        # Validar tiempos
        if attrs['start_datetime'] >= attrs['end_datetime']:
            raise ValidationError("End time must be after start time")
        
        # Validar disponibilidad
        is_valid, error = AvailabilityService.validate_slot_available(...)
        if not is_valid:
            raise ValidationError(error)
        
        return attrs
```

#### Frontend (TypeScript + Zod)
```typescript
// Validación de formularios con react-hook-form + zod
const bookingSchema = z.object({
  service: z.number(),
  professional: z.number(),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
});
```

### 5. Almacenamiento de Contraseñas

- **Algoritmo**: PBKDF2 con SHA256 (default de Django)
- **Iteraciones**: 390,000+
- **Salt**: Único por usuario
- Validación de complejidad activada

```python
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

### 6. HTTPS/TLS

#### Configuración de Producción
```python
# En settings.py cuando DEBUG=False
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

#### Nginx SSL
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### 7. Gestión de Secretos

#### Variables de Entorno
- **Nunca** commitear `.env` al repositorio
- `.env.example` sin valores sensibles
- SECRET_KEY de 50+ caracteres aleatorios

```bash
# Generar SECRET_KEY segura
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

#### Secretos en Docker
```yaml
# docker-compose.yml
env_file:
  - .env  # Variables sensibles fuera del código
```

### 8. Logging y Auditoría

#### Logs Estructurados
```python
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['console'],
            'level': 'WARNING',
        },
    },
}
```

#### Eventos Auditados
- Intentos de login fallidos
- Cambios en permisos de usuario
- Creación/cancelación de reservas
- Acceso a endpoints admin

### 9. Protección de Archivos Subidos

#### Validación de Uploads
```python
# En models.py
profile_image = models.ImageField(
    upload_to='profiles/',
    validators=[
        FileExtensionValidator(['jpg', 'jpeg', 'png']),
        validate_image_size  # Max 5MB
    ]
)
```

#### Servir Archivos Seguros
- Archivos media servidos por Nginx (no por Django)
- Validación de extensiones permitidas
- Límite de tamaño configurado

```nginx
location /media/ {
    alias /app/media/;
    expires 7d;
    add_header Cache-Control "public";
}
```

### 10. Headers de Seguridad

#### Configuración en Nginx
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

#### Content Security Policy (Recomendado añadir)
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

## 🚨 Vulnerabilidades Comunes y Prevenciones

### 1. Inyección de Comandos
❌ **No hacer**:
```python
import os
os.system(f"command {user_input}")  # PELIGROSO
```

✅ **Correcto**:
```python
import subprocess
subprocess.run(['command', user_input], check=True)  # SEGURO
```

### 2. Path Traversal
❌ **No hacer**:
```python
open(f"files/{user_filename}")  # PELIGROSO
```

✅ **Correcto**:
```python
from pathlib import Path
safe_path = Path("files") / Path(user_filename).name
```

### 3. Mass Assignment
❌ **No hacer**:
```python
User.objects.create(**request.data)  # PELIGROSO
```

✅ **Correcto**:
```python
serializer = UserSerializer(data=request.data)
serializer.is_valid(raise_exception=True)
serializer.save()
```

## 🔍 Auditoría de Seguridad

### Herramientas Recomendadas

#### Backend
```bash
# Safety - Vulnerabilidades en dependencias Python
pip install safety
safety check

# Bandit - Análisis de código Python
pip install bandit
bandit -r backend/
```

#### Frontend
```bash
# npm audit
npm audit

# Dependency check
npm audit fix
```

#### Docker
```bash
# Trivy - Escaneo de vulnerabilidades
docker run aquasec/trivy image neocore-backend:latest
```

### CI/CD Security Checks
GitHub Actions incluye:
- Trivy scan en cada push
- Dependency checks automáticos
- SARIF upload a GitHub Security

## 📋 Checklist de Seguridad

### Desarrollo
- [ ] `.env` en `.gitignore`
- [ ] SECRET_KEY única y compleja
- [ ] DEBUG=False en producción
- [ ] ALLOWED_HOSTS configurado
- [ ] Validación de todos los inputs
- [ ] Tests de seguridad escritos

### Producción
- [ ] HTTPS habilitado (SSL/TLS)
- [ ] Firewall configurado
- [ ] SSH con clave pública (no password)
- [ ] Puerto SSH cambiado (no 22)
- [ ] Fail2ban instalado
- [ ] Actualizaciones automáticas
- [ ] Backups automáticos y encriptados
- [ ] Logs monitoreados
- [ ] Rate limiting activo
- [ ] CORS configurado correctamente

### Aplicación
- [ ] Autenticación multifactor (opcional)
- [ ] Políticas de contraseña fuertes
- [ ] Sesiones con timeout
- [ ] Logs de auditoría
- [ ] Sanitización de HTML
- [ ] Validación de archivos subidos
- [ ] Rate limiting por usuario
- [ ] CAPTCHA en login (opcional)

## 🛡️ Mejores Prácticas

### 1. Principio de Menor Privilegio
- Los usuarios solo tienen acceso a lo necesario
- Roles bien definidos (CLIENT, PROFESSIONAL, ADMIN)
- Permisos granulares por endpoint

### 2. Defensa en Profundidad
- Múltiples capas de seguridad
- Validación en frontend Y backend
- Rate limiting en nginx Y Django

### 3. Seguridad por Diseño
- Seguro por defecto (DEBUG=False)
- Datos sensibles encriptados
- Auditoría de acciones críticas

### 4. Mantener Actualizado
```bash
# Backend
pip list --outdated
pip install -U package_name

# Frontend
npm outdated
npm update
```

## 🚀 Recomendaciones Adicionales

### Para Producción Enterprise

1. **WAF (Web Application Firewall)**
   - Cloudflare
   - AWS WAF
   - ModSecurity

2. **Monitoreo de Seguridad**
   - Sentry para errores y excepciones
   - Datadog para APM
   - ELK Stack para logs

3. **Escaneo Continuo**
   - Snyk
   - Dependabot (GitHub)
   - SonarQube

4. **Penetration Testing**
   - Tests de penetración anuales
   - Bug bounty program

5. **Compliance**
   - GDPR (si aplica)
   - LOPD (España)
   - ISO 27001 (opcional)

## 📞 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** abras un issue público
2. Envía email a: security@neocore.com
3. Incluye:
   - Descripción del problema
   - Pasos para reproducir
   - Impacto potencial
   - Solución sugerida (si la tienes)

---

**Última actualización**: Enero 2024
**Próxima revisión**: Julio 2024
