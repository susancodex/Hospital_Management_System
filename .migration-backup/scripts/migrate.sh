#!/bin/bash
# Database management scripts
# Run migrations
# Usage: ./scripts/migrate.sh

cd backend

echo "Running Django migrations..."
python manage.py migrate

echo "Creating superuser (if needed)..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@hospital.local', 'admin123')
    print("Superuser 'admin' created successfully")
else:
    print("Superuser 'admin' already exists")
END

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "✓ Migration complete!"
