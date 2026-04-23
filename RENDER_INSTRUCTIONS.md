# ✅ Render Deployment Instructions

## Step-by-Step Deployment Guide

### 1. Go to Render Dashboard
Visit https://render.com and login with your GitHub account.

### 2. Create New Blueprint Deployment
- Click **"New +"** button in top right
- Select **"Blueprint"** from the dropdown
- Select your repository: `susancodex/Hospital_Management_System`
- Click **"Connect"**

### 3. Configure Deployment
Render will automatically detect the `render.yaml` file:
- Give your project a name (e.g. `hospital-management-system`)
- Select the `main` branch
- Click **"Apply"**

### ✅ What Render Will Automatically Create:
1. **Backend Service (Python)**
   - Name: `hospital-management-backend`
   - Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start command: `gunicorn hospital_system.wsgi:application`
   - Runs on port 8000

2. **Frontend Service (Static Site)**
   - Name: `hospital-management-frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

### 4. Update Frontend API URL
After deployment completes:
1. Copy your Backend URL from Render dashboard (looks like: `https://hospital-management-backend-xxxx.onrender.com`)
2. Update the API base URL in `frontend/src/api/services.js` to point to your deployed backend
3. Commit and push the change - Render will automatically redeploy the frontend

### 5. Environment Variables (Optional)
Set these in Render dashboard for Backend service if needed:
- `GOOGLE_OAUTH_CLIENT_ID` - For Google authentication
- `ESEWA_MERCHANT_CODE` - For payment gateway
- Any other custom environment variables

## 🚀 Post Deployment Checks

✅ Backend health check: Visit `https://your-backend-url.onrender.com/admin`  
✅ Frontend health check: Visit your static site URL  
✅ Verify API is working: `https://your-backend-url.onrender.com/api/patients/`

## 🔍 Troubleshooting

### Build Failures
- Check Render build logs for specific errors
- Ensure all dependencies are listed in `backend/requirements.txt`
- Ensure Node.js version compatibility

### Backend 500 Errors
- Verify `DEBUG` is set to `True` temporarily to see errors
- Check `ALLOWED_HOSTS` includes .onrender.com
- Verify database migrations ran successfully

### Frontend API Errors
- Verify CORS is properly configured
- Ensure frontend API URL matches exactly your backend URL
- Check browser console for CORS/network errors

## 📝 Manual Deployment Alternative
If you don't want to use Blueprint:
1. Create a new **Web Service** for backend, set root directory to `backend`
2. Create a new **Static Site** for frontend, set root directory to `frontend`
3. Configure build and start commands manually

The project is fully configured for zero-config deployment with Render Blueprint.
