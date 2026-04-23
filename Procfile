web: cd backend && gunicorn hospital_system.wsgi:application --bind 0.0.0.0:$PORT --workers 2
release: cd backend && python manage.py migrate --noinput
