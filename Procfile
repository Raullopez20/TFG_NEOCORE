release: cd PROYECTO_NEOCORE/neocore/backend && python manage.py migrate --noinput
web: cd PROYECTO_NEOCORE/neocore/backend && gunicorn neocore.wsgi:application --bind 0.0.0.0:$PORT
