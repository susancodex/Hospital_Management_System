# Hospital Management System

Full-stack production-ready hospital management application with React + Vite frontend and Django REST backend.

## 🚀 Production Deployment

This project is configured for **Render** deployment. Use the included `render.yaml` blueprint to deploy both backend and frontend automatically.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router v7, Zustand, Axios, React Hook Form + Zod, ShadCN UI |
| **Backend** | Django 6, Django REST Framework 3.17, SimpleJWT, django-filter, CORS Headers, Whitenoise |
| **Deployment** | Render (Blueprint), Gunicorn, SQLite |

## 📁 Project Structure

Clean, production-ready project structure:

```
Hospital_Management_System/
├── backend/                     # Django Backend
│   ├── core/                    # Main application
│   │   ├── migrations/          # Database migrations
│   │   ├── models.py            # Database models
│   │   ├── serializers.py       # DRF serializers
│   │   ├── views.py             # API views
│   │   └── urls.py              # API routes
│   ├── hospital_system/         # Django project config
│   │   ├── settings.py          # Application settings
│   │   ├── urls.py              # Root URL config
│   │   └── wsgi.py              # WSGI entry point
│   ├── manage.py                # Django management script
│   └── requirements.txt         # Python dependencies
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── layouts/             # Layout components
│   │   ├── lib/                 # Utilities & config
│   │   ├── api/                 # API service layer
│   │   └── styles/              # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── render.yaml                  # Render deployment blueprint
├── RENDER_DEPLOYMENT_GUIDE.md   # Deployment instructions
└── readme.md
```

## 📋 Prerequisites

- Node.js 20+
- Python 3.12+
- pip / uv

## 🚦 Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Backend runs at: `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5000`

## 🏗️ Production Build

```bash
# Build frontend
cd frontend
npm run build

# Collect static files for Django
cd ../backend
python manage.py collectstatic --noinput
```

## 🔌 API Endpoints

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/token/` | Login (get JWT tokens) | ❌ |
| POST | `/token/refresh/` | Refresh access token | ❌ |
| POST | `/register/` | Register new user | ❌ |
| GET/PATCH | `/profile/` | User profile | ✅ |
| GET/POST | `/patients/` | Patients CRUD | ✅ |
| GET/POST | `/doctors/` | Doctors CRUD | ✅ |
| GET/POST | `/appointments/` | Appointments CRUD | ✅ |
| GET/POST | `/medical-records/` | Medical Records | ✅ |
| GET/POST | `/billing/` | Billing & Payments | ✅ |

## ⚙️ Environment Variables

Set these in production:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Set to `False` in production |
| `ALLOWED_HOSTS` | Comma separated allowed hosts |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID (optional) |

## 📦 Deployment

### Render Deployment
1. Push code to GitHub
2. Go to Render Dashboard → New → Blueprint
3. Select this repository
4. Confirm deployment

Render will automatically provision:
- Backend Python service on port 8000
- Frontend static site
- Automatically run migrations and static collection

## 🔒 Production Features

✅ CORS configured  
✅ WhiteNoise for static file serving  
✅ JWT Authentication  
✅ Input validation with Zod  
✅ Role based access control  
✅ Production ready WSGI server (Gunicorn)  
✅ Automatic database migrations  
✅ Zero downtime deployments

## 📄 License

MIT
