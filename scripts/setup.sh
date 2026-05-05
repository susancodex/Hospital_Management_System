#!/bin/bash
# Development setup script
# Initialize the project for local development

set -e

echo "🏥 Hospital Management System - Development Setup"
echo ""

# Check Python
echo "✓ Checking Python..."
python3 --version

# Check Node
echo "✓ Checking Node.js..."
node --version
npm --version

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd ../frontend
npm install

echo ""
echo "✓ Setup complete!"
echo ""
echo "Start development:"
echo "  Backend:  cd backend && python manage.py runserver 0.0.0.0:8000"
echo "  Frontend: cd frontend && npm run dev"
