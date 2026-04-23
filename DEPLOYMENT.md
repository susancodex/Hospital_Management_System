# Deployment Guide

This project is configured for:
- Backend deployment on Render
- Frontend deployment on Vercel

## 1. Backend Deployment (Render)

The repository includes [render.yaml](render.yaml) for Blueprint deployment.

### Steps
1. Push the repository to GitHub.
2. In Render, choose New > Blueprint.
3. Select the repository.
4. Apply the Blueprint.

Render will create one Python web service named `hospital-management-backend`.
It also provisions one managed Postgres database named `hospital-management-db`.

### Backend environment variables
Set these in Render service settings:

- `SECRET_KEY`: generate a secure value
- `DEBUG`: `False`
- `DATABASE_URL`: auto-populated from Render Postgres (Blueprint)
- `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGIN_REGEXES`: `^https://.*\\.vercel\\.app$`
- `CSRF_TRUSTED_ORIGINS`: `https://*.vercel.app`
- `GOOGLE_OAUTH_CLIENT_ID`: optional

### Build and start commands (already in render.yaml)
- Build:
  - `pip install -r backend/requirements.txt`
  - `python manage.py migrate --noinput`
  - `python manage.py collectstatic --noinput`
- Start:
  - `gunicorn hospital_system.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

## 2. Frontend Deployment (Vercel)

The repository includes [vercel.json](vercel.json) configured for the Vite frontend in [frontend](frontend).

### Steps
1. Import the repository in Vercel.
2. Keep the detected project settings from `vercel.json`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://your-render-backend.onrender.com/api`
4. Deploy.

## 3. Post-deployment checks

1. Backend health endpoint:
   - `https://your-render-backend.onrender.com/api/`
2. Frontend loads from Vercel URL.
3. Login, registration, and CRUD requests succeed.
4. Browser network tab shows API calls targeting Render URL, not localhost.

## 4. Notes

- API base URL is environment-driven in [frontend/src/api/client.js](frontend/src/api/client.js).
- CORS and CSRF trusted origins are environment-driven in [backend/hospital_system/settings.py](backend/hospital_system/settings.py).
- Database configuration in [backend/hospital_system/settings.py](backend/hospital_system/settings.py) uses `DATABASE_URL` when present and falls back to SQLite for local development.


