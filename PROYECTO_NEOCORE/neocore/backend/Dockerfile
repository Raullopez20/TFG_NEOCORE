FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project source
COPY . /app/

# Collect static files at build time (fails silently if no DB is available)
RUN python manage.py collectstatic --noinput || true

# Railway injects PORT; fall back to 8000 for local / docker-compose use
EXPOSE 8000

# Startup sequence:
#   1. collectstatic  — ensures static files exist even when build had no DB
#   2. migrate        — applies pending migrations before serving traffic
#   3. gunicorn       — binds to ${PORT:-8000} (Railway injects PORT at runtime)
CMD ["sh", "-c", \
     "python manage.py collectstatic --noinput && \
      python manage.py migrate --noinput && \
      gunicorn neocore.wsgi:application \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers 4 \
        --worker-class gthread \
        --threads 2 \
        --timeout 120 \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --log-level info \
        --access-logfile - \
        --error-logfile -"]
