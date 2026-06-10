# Guía para Administradores - NeoCore

## 🎯 Panel de Administración

Acceso: `http://localhost:8000/admin/` o `https://tudominio.com/admin/`

Credenciales iniciales: Las que creaste con `python manage.py createsuperuser`

## 📚 Gestión de Usuarios

### Crear Profesional

1. Ir a **Users** → **Add User**
2. Completar datos básicos:
   - Email
   - Contraseña
   - Nombre y Apellidos
3. En sección **Role & Professional info**:
   - Role: **PROFESSIONAL**
   - Specialty: Ej. "Fisioterapia"
   - Bio: Descripción del profesional
4. Guardar

### Cambiar Rol de Usuario

1. **Users** → Seleccionar usuario
2. Cambiar campo **Role**
3. Si es profesional, completar **Specialty** y **Bio**
4. Guardar

### Desactivar Usuario

1. **Users** → Seleccionar usuario
2. Desmarcar **Active**
3. Guardar

## 🏥 Gestión de Servicios

### Crear Servicio

1. **Services** → **Add Service**
2. Completar:
   - Name: Ej. "Sesión de Fisioterapia"
   - Description: Descripción detallada
   - Duration (minutes): Ej. 60
   - Price: Ej. 45.00 (opcional)
   - Active: Marcar
3. En **Professionals**: Seleccionar profesionales que ofrecen este servicio
4. Guardar

### Asignar Profesionales a Servicio

1. **Services** → Seleccionar servicio
2. En **Professionals**: Seleccionar de la lista
3. Guardar

## 📅 Gestión de Disponibilidad

### Configurar Horarios de Profesional

1. **Availability rules** → **Add**
2. Seleccionar:
   - Professional
   - Day of week: (0=Lunes, 6=Domingo)
   - Start time: Ej. 09:00
   - End time: Ej. 18:00
3. Guardar

### Ejemplo: Lunes a Viernes 9-18h

Crear 5 reglas (una por cada día):
- Day 0 (Lunes): 09:00 - 18:00
- Day 1 (Martes): 09:00 - 18:00
- Day 2 (Miércoles): 09:00 - 18:00
- Day 3 (Jueves): 09:00 - 18:00
- Day 4 (Viernes): 09:00 - 18:00

### Añadir Vacaciones/Ausencias

1. **Time offs** → **Add**
2. Completar:
   - Professional
   - Start date: Ej. 2024-02-01
   - End date: Ej. 2024-02-07
   - Reason: Ej. "Vacaciones"
3. Guardar

## 📋 Gestión de Reservas

### Ver Todas las Reservas

**Bookings** → Lista de todas las reservas con filtros:
- Status (Pendiente, Confirmada, etc.)
- Service
- Professional
- Client

### Acciones en Masa

Seleccionar reservas y usar **Action**:
- Mark selected as Confirmed
- Mark selected as Done
- Mark selected as Canceled

### Cambiar Estado Manualmente

1. **Bookings** → Seleccionar reserva
2. Cambiar **Status**
3. Guardar

## 📊 Estadísticas

### Ver Estadísticas

API endpoint (requiere autenticación admin):
```
GET /api/bookings/stats/?days=30
```

Devuelve:
- Total de reservas
- Por estado
- Por servicio
- Por profesional
- Esta semana/mes

## 🔧 Tareas de Mantenimiento

### Ver Logs de Notificaciones

**Notification logs** → Ver todas las notificaciones enviadas:
- Estado (Enviado/Fallido)
- Destinatario
- Tipo
- Error (si falló)

### Limpiar Notificaciones Antiguas

Se ejecuta automáticamente (Celery Beat cada día):
```python
# Elimina notificaciones >90 días
cleanup_old_notifications()
```

## 🚀 Comandos Útiles

### Crear Datos de Prueba
```bash
docker-compose exec web python manage.py seed_data
```

### Ver Usuarios
```bash
docker-compose exec web python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.all()
```

### Backup de BD
```bash
docker-compose exec db pg_dump -U neocore_user neocore_db > backup.sql
```

### Restore de BD
```bash
cat backup.sql | docker-compose exec -T db psql -U neocore_user neocore_db
```

## ✅ Checklist Diario/Semanal

### Diario
- [ ] Revisar reservas pendientes
- [ ] Verificar notificaciones fallidas
- [ ] Responder consultas de usuarios

### Semanal
- [ ] Revisar estadísticas
- [ ] Verificar disponibilidad de profesionales
- [ ] Backup de base de datos

### Mensual
- [ ] Auditoría de usuarios inactivos
- [ ] Revisar servicios no utilizados
- [ ] Actualizar información de profesionales
