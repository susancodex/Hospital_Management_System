# 🏥 Hospital Management System

A full-stack, production-ready hospital management application built with Django REST Framework and React + Vite.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Quick Reference](#quick-reference)

## ✨ Features

- **User Management**: Role-based access control (Admin, Doctor, Patient, Staff)
- **Appointments**: Schedule and manage medical appointments
- **Medical Records**: Secure patient medical history and reports
- **Billing System**: Invoice generation and payment tracking
- **AI Triage**: Intelligent patient assessment system
- **Real-time Updates**: Live notifications and status updates
- **PDF Generation**: Medical reports in PDF format
- **Authentication**: JWT-based authentication with Google OAuth support
- **Dark Mode**: Theme toggle for better accessibility

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 6.0+ with Django REST Framework
- **Database**: PostgreSQL 16
- **Authentication**: SimpleJWT + Google OAuth
- **API**: RESTful with filtering and pagination
- **Server**: Gunicorn + WhiteNoise for static files
- **Admin**: Django admin interface

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Build Tool**: Vite 8

### DevOps
- **Containerization**: Docker & Docker Compose
- **Platform**: Render (Backend) / Vercel (Frontend)

## 📁 Project Structure

```
hospital-management-system/
├── backend/                 # Django REST API
│   ├── hospital_system/     # Main project
│   ├── core/                # Application logic
│   ├── migrations/          # Database migrations
│   ├── media/               # User uploads
│   ├── requirements.txt     # Python dependencies
│   └── manage.py
│
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── api/             # API client
│   │   ├── context/         # React Context
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   └── styles/          # CSS
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── scripts/                 # Utility scripts
│   ├── setup.sh            # Development setup
│   ├── migrate.sh          # Database migrations
│   └── docker-up.sh        # Docker startup
│
├── Dockerfile              # Multi-stage backend container
├── docker-compose.yml      # Development environment
├── render.yaml             # Render deployment config
├── vercel.json             # Vercel frontend deployment
├── .env.example            # Environment template
└── README.md               # This file
```

## 📋 Prerequisites

- **Python**: 3.12+
- **Node.js**: 20+
- **PostgreSQL**: 16+ (for production)
- **Docker**: 20.10+ (optional)

## 🚀 Local Development

### Quick Setup (Automated)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run setup (installs all dependencies)
./scripts/setup.sh
```

### Manual Backend Setup

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Copy environment file
cp .env.example .env

# Apply migrations
cd backend
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Run development server
python manage.py runserver 0.0.0.0:8000
```

**Backend**: http://localhost:8000  
**Admin**: http://localhost:8000/admin

### Manual Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Start dev server
npm run dev
```

**Frontend**: http://localhost:5173

## 🐳 Docker Development

### Using Docker Compose (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Start all services
chmod +x scripts/docker-up.sh
./scripts/docker-up.sh

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build --no-cache
```

**Available Services:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- PostgreSQL: localhost:5432

## 🌐 Production Deployment

### Render Backend (Already Configured)

Your backend is already deployed on Render using `render.yaml`. To maintain deployment:

1. **Environment Variables** (set in Render dashboard):
   ```
   SECRET_KEY           # Set if not auto-generated
   DEBUG                # False
   DATABASE_URL         # Auto-provided by Render
   ALLOWED_HOSTS        # Auto-configured
   CORS_ALLOWED_ORIGINS # Update with your frontend URL
   ```

2. **Deploy Updates**:
   ```bash
   git add .
   git commit -m "Production update"
   git push origin main
   # Render auto-deploys after push
   ```

3. **Database URL**:
   - If existing PostgreSQL on Render: Set `DATABASE_URL` env var
   - Otherwise: Render provisions one automatically

### Vercel Frontend

Deploy frontend to Vercel for best performance:

1. **Import to Vercel**:
   - Sign in to Vercel
   - Import this GitHub repository
   - Set root directory: `frontend`

2. **Environment Variables** (Vercel Dashboard):
   ```
   VITE_API_URL=https://your-render-backend.onrender.com/api
   ```

3. **Deploy**:
   ```bash
   npm install -g vercel
   cd frontend
   vercel --prod
   ```

### Docker Image Push (Optional)

```bash
# Build image
docker build -t hospital-management:latest .

# Push to Docker Hub
docker tag hospital-management:latest yourusername/hospital-management:latest
docker push yourusername/hospital-management:latest

# Or GitHub Container Registry
docker tag hospital-management:latest ghcr.io/yourusername/hospital-management:latest
docker push ghcr.io/yourusername/hospital-management:latest
```

## 🔐 Environment Variables

See [.env.example](.env.example) for complete list.

**Critical Variables:**
```
SECRET_KEY              # Generate: openssl rand -hex 32
DEBUG                   # False in production
DATABASE_URL            # PostgreSQL connection string
ALLOWED_HOSTS           # .onrender.com,.vercel.app
CORS_ALLOWED_ORIGINS    # Your frontend domain
CSRF_TRUSTED_ORIGINS    # Your frontend domain
```

**⚠️ Never commit `.env` file with real credentials!**

## 📚 API Documentation

### Quick Examples

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

**Protected Request:**
```bash
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <token>"
```

### Main Endpoints

- Users: `/api/users/`
- Appointments: `/api/appointments/`
- Medical Records: `/api/medical-records/`
- Billing: `/api/billing/`
- Doctors: `/api/doctors/`
- Admin: `/api/admin/`

**Full API Documentation**: http://localhost:8000/api/schema/

## 🛠️ Useful Commands

```bash
# Backend
python manage.py makemigrations    # Create migrations
python manage.py migrate           # Apply migrations
python manage.py shell             # Django shell
python manage.py createsuperuser   # Create admin
python manage.py runserver         # Dev server

# Frontend
npm run build                       # Production build
npm run preview                     # Preview build
npm run lint                        # Check code

# Docker
docker-compose up -d               # Start
docker-compose down                # Stop
docker-compose logs -f             # Logs
docker-compose exec backend sh     # Shell into container

# Database
./scripts/migrate.sh               # Run migrations
```

## 🚀 Quick Reference

```bash
# First time setup
./scripts/setup.sh

# Development with Docker
./scripts/docker-up.sh

# Development locally
cd backend && python manage.py runserver
cd frontend && npm run dev

# Deployment (auto on git push to main)
git push origin main
```

## 📊 Important Notes for Render Deployment

✅ **Fully Compatible**:
- Migrations run automatically in `buildCommand`
- Static files collected in `buildCommand`
- WhiteNoise configured for static file serving
- `render.yaml` pre-configured

⚠️ **Things to Remember**:
- Don't modify `render.yaml` unless you know what you're doing
- Set `SECRET_KEY` and database credentials in Render env vars
- Frontend should connect to `https://your-backend.onrender.com/api`
- Render free tier includes one PostgreSQL database

## 🔄 Maintenance

```bash
# Backup database
pg_dump DATABASE_URL > backup.sql

# Restore database
psql DATABASE_URL < backup.sql

# View Render logs
render logs hospital-management-backend

# SSH into Render service (paid plans)
render shell hospital-management-backend
```

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS Error | Check CORS_ALLOWED_ORIGINS env var |
| Database Connection Failed | Verify DATABASE_URL, check PostgreSQL running |
| 404 API Not Found | Frontend pointing to correct API_URL |
| Port Already Used | Change port or kill existing process |
| Docker Build Fails | Run `docker-compose build --no-cache` |

## 📄 License

MIT License

## 🎉 Status

✅ **Production Ready**  
✅ **Dockerized**  
✅ **Deployed on Render**  
✅ **Scalable Architecture**

---

**Version**: 1.0.0 | **Last Updated**: May 2026 | **Status**: Active

