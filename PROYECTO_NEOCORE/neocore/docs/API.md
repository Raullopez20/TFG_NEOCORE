# NeoCore API Documentation

## Base URL

```
http://localhost:8000/api/
```

## Authentication

NeoCore utiliza JWT (JSON Web Tokens) para autenticación.

### Headers requeridos para endpoints protegidos

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

### 🔐 Authentication

#### POST `/api/auth/register/`

Registrar nuevo usuario (cliente).

**Request:**
```json
{
  "email": "usuario@example.com",
  "password1": "contraseña_segura",
  "password2": "contraseña_segura",
  "first_name": "Nombre",
  "last_name": "Apellidos",
  "phone": "+34600111222"
}
```

**Response:** `201 Created`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "first_name": "Nombre",
    "last_name": "Apellidos",
    "role": "CLIENT"
  }
}
```

---

#### POST `/api/auth/login/`

Iniciar sesión.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña_segura"
}
```

**Response:** `200 OK`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "full_name": "Nombre Apellidos",
    "role": "CLIENT"
  }
}
```

---

#### POST `/api/auth/logout/`

Cerrar sesión.

**Request:** No body required (autenticado)

**Response:** `200 OK`

---

#### GET `/api/auth/users/me/`

Obtener información del usuario autenticado.

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "first_name": "Nombre",
  "last_name": "Apellidos",
  "full_name": "Nombre Apellidos",
  "phone": "+34600111222",
  "role": "CLIENT",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

#### GET `/api/auth/users/me/export/`

Exportar todos los datos personales del usuario autenticado (RGPD).

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "first_name": "Nombre",
    "last_name": "Apellidos",
    "role": "CLIENT",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "bookings_as_client": [],
  "bookings_as_professional": [],
  "reviews_authored": []
}
```

---

#### DELETE `/api/auth/users/me/delete/`

Solicitar eliminación de cuenta (RGPD).

Esta operación anoniriza datos personales, desactiva la cuenta y cancela
reservas activas asociadas para conservar integridad histórica.

**Request:**
```json
{
  "current_password": "tu_contrasena_actual"
}
```

**Response:** `204 No Content`

---

### 👥 Users & Professionals

#### GET `/api/auth/users/professionals/`

Listar profesionales activos (público).

**Query Params:**
- `specialty` (opcional): Filtrar por especialidad

**Response:** `200 OK`
```json
[
  {
    "id": 2,
    "full_name": "María García",
    "specialty": "Fisioterapia",
    "bio": "Fisioterapeuta especializada en rehabilitación deportiva...",
    "profile_image": "/media/profiles/maria.jpg"
  }
]
```

---

### 🏥 Services

#### GET `/api/services/`

Listar servicios activos.

**Response:** `200 OK`
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Sesión de Fisioterapia",
      "description": "Tratamiento fisioterapéutico personalizado...",
      "duration_minutes": 60,
      "price": "45.00",
      "image": "/media/services/fisio.jpg",
      "available_professionals_count": 2
    }
  ]
}
```

---

#### GET `/api/services/{id}/`

Detalle de un servicio.

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Sesión de Fisioterapia",
  "description": "Tratamiento fisioterapéutico personalizado...",
  "duration_minutes": 60,
  "price": "45.00",
  "image": "/media/services/fisio.jpg",
  "available_professionals_count": 2,
  "professionals_list": [
    {
      "id": 2,
      "full_name": "María García",
      "specialty": "Fisioterapia",
      "bio": "...",
      "profile_image": "/media/profiles/maria.jpg"
    }
  ]
}
```

---

### 📅 Availability

#### GET `/api/availability/slots/get_slots/`

Obtener slots disponibles para un profesional y servicio (público).

**Query Params (requeridos):**
- `professional_id`: ID del profesional
- `service_duration`: Duración en minutos

**Query Params (opcionales):**
- `start_date`: Fecha inicio (YYYY-MM-DD), default: hoy
- `end_date`: Fecha fin (YYYY-MM-DD), default: +14 días

**Response:** `200 OK`
```json
{
  "professional_id": 2,
  "service_duration": 60,
  "start_date": "2024-01-15",
  "end_date": "2024-01-29",
  "slots": [
    {
      "start_datetime": "2024-01-15T09:00:00Z",
      "end_datetime": "2024-01-15T10:00:00Z",
      "is_available": true
    },
    {
      "start_datetime": "2024-01-15T10:00:00Z",
      "end_datetime": "2024-01-15T11:00:00Z",
      "is_available": true
    }
  ]
}
```

---

#### GET `/api/availability/rules/`

Listar reglas de disponibilidad (profesionales y admins).

**Query Params:**
- `professional`: Filtrar por ID de profesional

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "professional": 2,
    "professional_name": "María García",
    "day_of_week": 0,
    "day_name": "Monday",
    "start_time": "09:00:00",
    "end_time": "18:00:00",
    "is_active": true
  }
]
```

---

#### POST `/api/availability/rules/`

Crear nueva regla de disponibilidad (profesionales).

**Request:**
```json
{
  "day_of_week": 0,
  "start_time": "09:00",
  "end_time": "18:00"
}
```

**Response:** `201 Created`

---

#### GET `/api/availability/time-off/`

Listar períodos de ausencia.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "professional": 2,
    "professional_name": "María García",
    "start_date": "2024-02-01",
    "end_date": "2024-02-07",
    "reason": "Vacaciones"
  }
]
```

---

#### POST `/api/availability/time-off/`

Crear período de ausencia.

**Request:**
```json
{
  "start_date": "2024-02-01",
  "end_date": "2024-02-07",
  "reason": "Vacaciones"
}
```

**Response:** `201 Created`

---

### 📋 Bookings

#### GET `/api/bookings/`

Listar reservas del usuario autenticado.

**Query Params:**
- `status`: Filtrar por estado (PENDING, CONFIRMED, etc.)
- `service`: Filtrar por servicio
- `professional`: Filtrar por profesional

**Response:** `200 OK`
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "client_name": "Pedro Sánchez",
      "professional_name": "María García",
      "service_name": "Sesión de Fisioterapia",
      "start_datetime": "2024-01-20T10:00:00Z",
      "end_datetime": "2024-01-20T11:00:00Z",
      "status": "CONFIRMED",
      "created_at": "2024-01-15T12:00:00Z"
    }
  ]
}
```

---

#### GET `/api/bookings/{id}/`

Detalle de una reserva.

**Response:** `200 OK`
```json
{
  "id": 1,
  "client": 1,
  "client_info": {
    "id": 1,
    "email": "pedro@example.com",
    "full_name": "Pedro Sánchez"
  },
  "professional": 2,
  "professional_info": {
    "id": 2,
    "full_name": "María García",
    "specialty": "Fisioterapia"
  },
  "service": 1,
  "service_info": {
    "id": 1,
    "name": "Sesión de Fisioterapia",
    "duration_minutes": 60
  },
  "start_datetime": "2024-01-20T10:00:00Z",
  "end_datetime": "2024-01-20T11:00:00Z",
  "duration_minutes": 60,
  "status": "CONFIRMED",
  "client_notes": "Primera sesión",
  "is_past": false,
  "is_upcoming": true,
  "created_at": "2024-01-15T12:00:00Z"
}
```

---

#### POST `/api/bookings/`

Crear nueva reserva (clientes).

**Request:**
```json
{
  "service": 1,
  "professional": 2,
  "start_datetime": "2024-01-20T10:00:00Z",
  "end_datetime": "2024-01-20T11:00:00Z",
  "client_notes": "Primera sesión"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "status": "PENDING",
  ...
}
```

**Errores comunes:**
- `400`: Slot no disponible o inválido
- `403`: Solo clientes pueden crear reservas

---

#### POST `/api/bookings/{id}/confirm/`

Confirmar reserva pendiente (profesionales).

**Response:** `200 OK`
```json
{
  "id": 1,
  "status": "CONFIRMED",
  ...
}
```

---

#### POST `/api/bookings/{id}/reject/`

Rechazar reserva pendiente (profesionales).

**Request:**
```json
{
  "reason": "No disponible en ese horario"
}
```

**Response:** `200 OK`

---

#### POST `/api/bookings/{id}/cancel/`

Cancelar reserva (cliente o profesional).

**Request:**
```json
{
  "reason": "Motivo de cancelación"
}
```

**Response:** `200 OK`

---

#### POST `/api/bookings/{id}/mark_done/`

Marcar reserva como completada (profesionales).

**Response:** `200 OK`

---

#### GET `/api/bookings/upcoming/`

Listar próximas citas del usuario.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "service_name": "Sesión de Fisioterapia",
    "professional_name": "María García",
    "start_datetime": "2024-01-20T10:00:00Z",
    "status": "CONFIRMED"
  }
]
```

---

#### GET `/api/bookings/past/`

Listar citas pasadas del usuario.

**Response:** `200 OK`

---

### 📊 Admin & Stats

#### GET `/api/bookings/stats/`

Estadísticas de reservas (solo admins).

**Query Params:**
- `days`: Número de días hacia atrás (default: 30)

**Response:** `200 OK`
```json
{
  "total_bookings": 150,
  "pending_bookings": 5,
  "confirmed_bookings": 120,
  "completed_bookings": 100,
  "canceled_bookings": 15,
  "rejected_bookings": 10,
  "bookings_by_service": {
    "Sesión de Fisioterapia": 80,
    "Consulta Nutricional": 40,
    "Entrenamiento Personal": 30
  },
  "bookings_by_professional": {
    "María García": 80,
    "Juan López": 40,
    "Ana Martínez": 30
  },
  "bookings_this_week": 25,
  "bookings_this_month": 90
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminación exitosa |
| 400 | Bad Request - Error de validación |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/bookings/` (POST) | 10 requests/min |
| Endpoints públicos | 100 requests/hour |
| Usuarios autenticados | 1000 requests/hour |

## Error Response Format

```json
{
  "error": "Mensaje de error descriptivo",
  "detail": "Detalles adicionales del error",
  "code": "error_code"
}
```

## Paginación

Los endpoints que retornan listas usan paginación:

```json
{
  "count": 100,
  "next": "http://api.example.com/api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

**Query params de paginación:**
- `page`: Número de página (default: 1)
- `page_size`: Resultados por página (default: 20, max: 100)

## Swagger/OpenAPI

Documentación interactiva disponible en:

```
http://localhost:8000/api/docs/
```
