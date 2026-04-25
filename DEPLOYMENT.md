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

Important for Render free tier: only one active free Postgres database is allowed per account.
This Blueprint does not create a database resource, so you can attach an existing database.

### Backend environment variables
Set these in Render service settings:

- `SECRET_KEY`: generate a secure value
- `DEBUG`: `False`
- `DATABASE_URL`: set this manually from your existing Render Postgres connection string
- `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGIN_REGEXES`: `^https://.*\\.vercel\\.app$`
- `CSRF_TRUSTED_ORIGINS`: `https://*.vercel.app`
- `GOOGLE_OAUTH_CLIENT_ID`: optional

If you already have a free Postgres database:
1. Open that database in Render.
2. Copy its External Database URL (connection string).
3. Open the web service environment settings.
4. Add `DATABASE_URL` with that value.
5. Redeploy the service.

### Build and start commands (already in render.yaml)
- Build:
  - `pip install -r requirements.txt`
  - `python manage.py migrate --noinput`
  - `python manage.py collectstatic --noinput`
- Start:
  - `gunicorn hospital_system.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

## 2. Frontend Deployment (Vercel)

The repository includes [vercel.json](vercel.json) configured for the Vite frontend in [frontend](frontend), while keeping the monorepo layout.

### Steps
1. Import the repository in Vercel.
2. Framework preset: Vite (from `vercel.json`).
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


