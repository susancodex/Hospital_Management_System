# Hospital Management System

Full-stack hospital management application with:
- Django REST API backend in [backend](backend)
- React + Vite frontend in [frontend](frontend)

## Tech Stack
- Backend: Django, DRF, SimpleJWT, django-filter, WhiteNoise, Gunicorn
- Frontend: React 19, Vite 8, Tailwind CSS 4, Axios, Zustand
- Deployment target: Render (backend) + Vercel (frontend)

## Local Development

### 1. Backend
```bash
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
- One managed Postgres database (`hospital-management-db`)

Detailed steps and environment variables are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Important Environment Variables

### Backend (Render)
- `SECRET_KEY`
- `DEBUG=False`
- `DATABASE_URL` (in Blueprint mode, auto-linked from Render Postgres)
- `ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`
- `CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app`

### Frontend (Vercel)
- `VITE_API_BASE_URL=https://your-render-backend.onrender.com/api`

## License
MIT

