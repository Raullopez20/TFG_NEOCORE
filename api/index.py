"""
Punto de entrada serverless de Vercel para el backend Django NeoCore.

Vercel convierte cualquier archivo Python dentro de /api/ en una funcion
serverless expuesta en /api/<nombre>. Este archivo expone la aplicacion
WSGI de Django bajo el nombre ``app`` (el detectado por el runtime
`@vercel/python`). Con el `rewrite` de `vercel.json`, todas las peticiones
a `/api/*` se reescriben a `/api/index` y Django procesa la URL original.

Importante:
    - Este modulo fuerza `DJANGO_SETTINGS_MODULE=neocore.settings_vercel`,
      una variante ligera pensada para ejecucion serverless (sin Celery,
      sin Redis, sin archivos multimedia de escritura).
    - El path al backend se anade al sys.path para que los imports
      `neocore.*` y `apps.*` resuelvan sin instalar el paquete.
"""

import os
import sys
from pathlib import Path

# --- Resolver rutas del proyecto -------------------------------------------
# /repo_root/api/index.py  -> BASE_DIR = /repo_root
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "PROYECTO_NEOCORE" / "neocore" / "backend"

# Anadir el backend al sys.path para que `import neocore` y `import apps`
# funcionen sin necesidad de instalar el paquete en modo editable.
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# --- Configurar Django ------------------------------------------------------
# Usamos un modulo de settings especifico para Vercel que deshabilita
# componentes incompatibles con serverless (Celery, Redis, axes, allauth).
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "neocore.settings_vercel")

# Algunos defaults seguros por si las env vars no estan definidas en Vercel.
os.environ.setdefault("DEBUG", "False")
os.environ.setdefault("SECRET_KEY", "change-me-in-vercel-env-vars")

# --- Exportar la aplicacion WSGI --------------------------------------------
from django.core.wsgi import get_wsgi_application  # noqa: E402

# `app` es el nombre que detecta el runtime Python de Vercel.
app = get_wsgi_application()

# Alias estandar WSGI por compatibilidad con otros adaptadores.
application = app
