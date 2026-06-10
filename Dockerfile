FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=neocore.settings

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    build-essential \
    curl \
    libmagic1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (cached layer)
COPY PROYECTO_NEOCORE/neocore/backend/requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy Django app
COPY PROYECTO_NEOCORE/neocore/backend/ /app/

# Collect static files (non-fatal: may not have DB env vars at build time)
RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

# WEB_CONCURRENCY: set to 1 when using SQLite (default), higher for PostgreSQL
CMD ["sh", "-c", \
     "echo '=== NeoCore startup ===' && \
      echo 'PORT='${PORT:-8000} && \
      echo 'DB='${DATABASE_URL:+postgresql} && \
      python manage.py migrate --noinput && \
      echo 'Migrations done. Booting gunicorn...' && \
      exec gunicorn neocore.wsgi:application \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers ${WEB_CONCURRENCY:-1} \
        --worker-class sync \
        --timeout 120 \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --log-level info \
        --access-logfile - \
        --error-logfile -"]
