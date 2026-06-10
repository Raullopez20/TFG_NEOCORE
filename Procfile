# Procfile — local development / Docker Compose only.
# Production deployments use Vercel (see PROYECTO_NEOCORE/neocore/backend/vercel.json).
web: cd PROYECTO_NEOCORE/neocore/backend && python manage.py migrate --noinput && gunicorn neocore.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 4 --worker-class gthread --threads 2 --timeout 120 --max-requests 1000 --max-requests-jitter 50 --log-level info --access-logfile - --error-logfile -
