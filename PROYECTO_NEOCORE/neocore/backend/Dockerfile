FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
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

# Copy project
COPY . /app/

EXPOSE 8000

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
