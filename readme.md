# Hospital Management System

Full-stack hospital management application with:
- Django REST API backend in [backend](backend)
- React + Vite frontend in [frontend](frontend)

## Tech Stack
- Backend: Django, DRF, SimpleJWT, django-filter, WhiteNoise, Gunicorn
- Frontend: React 19, Vite 8, Tailwind CSS 4, Axios, Zustand
Deployment target: Render (backend + optional frontend static site) or Vercel (frontend)

## Local Development

### 1. Backend
```bash
You can also deploy the frontend from Render using the `hospital-management-frontend` static service in [render.yaml](render.yaml).
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5000  
Backend API: http://localhost:8000/api

## Deployment

This repo is prepared for split deployment:
- Render for backend using [render.yaml](render.yaml)
- Vercel for frontend using [vercel.json](vercel.json)

Render Blueprint provisions:
- One Python web service (`hospital-management-backend`)

If your Render account already has an active free Postgres database, set `DATABASE_URL` from that existing database in the web service environment variables.

Detailed steps and environment variables are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

Note: Render free-tier services do not support `preDeployCommand`; migrations run in `buildCommand`.

## Important Environment Variables

### Backend (Render)
- `SECRET_KEY`
- `DEBUG=False`
- `DATABASE_URL` (set manually from your existing Render Postgres connection string)
- `ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\\.vercel\\.app$`
- `CSRF_TRUSTED_ORIGINS=https://*.vercel.app`

### Frontend (Vercel)
- `VITE_API_BASE_URL=https://your-render-backend.onrender.com/api`

## License
MIT

