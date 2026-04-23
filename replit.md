# Hospital Management System

Fullstack app: Django REST backend + React/Vite frontend.

## Dev (Replit)
- **Backend** workflow: `python manage.py runserver 0.0.0.0:8000` (port 8000)
- **Frontend** workflow: `npm run dev` (Vite, port 5000, host 0.0.0.0, allowedHosts true, proxies `/api` → backend:8000)

## Deployment (Autoscale)
- Build: install/build frontend, collectstatic, migrate
- Run: gunicorn binds 0.0.0.0:5000
- Django + WhiteNoise serves the built frontend (`frontend/dist`) as the SPA, plus `/api` and `/admin`.

## Stack
- Frontend: React 19, Vite 8, Tailwind 4, Zustand, Axios, React Router 7
- Backend: Django 6, DRF, SimpleJWT, django-filter, WhiteNoise
- DB: SQLite
