# Render Deployment Guide

## Steps to deploy:

1. **Push your code to GitHub/GitLab**
2. **Go to Render dashboard**: https://render.com
3. **Click "New +" > "Blueprint"**
4. **Select your repository**
5. **Render will automatically detect `render.yaml` file**
6. **Confirm the deployment**

## Configuration:

The deployment creates two services:
- **Backend**: Python/Django service running on port 8000
- **Frontend**: Static Vite/React site

## Environment Variables:

Set these in Render dashboard for Backend service:
- `SECRET_KEY`: Automatically generated
- `DEBUG`: False
- `ALLOWED_HOSTS`: .onrender.com
- `GOOGLE_OAUTH_CLIENT_ID` (if using Google auth)
- Any other required environment variables

## After deployment:

1. Get your Backend URL from Render
2. Update frontend API base URL in `frontend/src/config/api.ts` or similar file to point to your Render backend URL
3. Rebuild the frontend service

## Build commands:
- Backend: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- Frontend: `npm install && npm run build`

## Start command:
- Backend: `gunicorn hospital_system.wsgi:application`
