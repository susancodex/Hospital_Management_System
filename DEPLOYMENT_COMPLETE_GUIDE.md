# 🚀 Hospital Management System - Complete Deployment Guide

**Status Overview:**
- ✅ Backend: Django + DRF (Ready for Render)
- ✅ Frontend: React + Vite (Ready for Vercel)
- ✅ Configuration: Already set up in `render.yaml` and `vercel.json`

---

## 📋 Table of Contents

1. [Backend Deployment (Render)](#backend-deployment-render)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Troubleshooting](#troubleshooting)
4. [Post-Deployment Verification](#post-deployment-verification)

---

## 🔧 Backend Deployment (Render)

### Prerequisites
- GitHub repository with code pushed
- Render account (free or paid)
- (Optional) Render PostgreSQL database already created

### Step 1: Verify Backend Configuration

Your `requirements.txt` already includes all necessary packages:

```
django>=6.0.4
django-cors-headers>=4.9.0
django-filter>=25.2
djangorestframework>=3.17.1
djangorestframework-simplejwt>=5.5.1
dj-database-url>=2.2.0
google-auth>=2.38.0
psycopg[binary]>=3.2.9
python-dotenv>=1.0.1
requests>=2.32.0
reportlab>=4.4.10
whitenoise>=6.6.0
gunicorn>=22.0.0
```

✅ **Status**: All dependencies present, including:
- `gunicorn`: WSGI application server
- `whitenoise`: Static file serving
- `dj-database-url`: Database URL parsing
- `django-cors-headers`: CORS support

### Step 2: Review Backend Settings

Your `backend/hospital_system/settings.py` is properly configured with:

- ✅ **Dynamic SECRET_KEY** from environment (with fallback)
- ✅ **DEBUG mode** controlled by environment variable (disabled in production)
- ✅ **ALLOWED_HOSTS** includes `.onrender.com` and `.vercel.app`
- ✅ **CORS configuration** for frontend communication
- ✅ **WhiteNoise middleware** for static files
- ✅ **SSL/HTTPS** security headers for production
- ✅ **Database URL** support for PostgreSQL

**Key settings snippet** (already in place):
```python
# Production-safe configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback-key')
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('1', 'true', 'yes', 'on')
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', '*,.vercel.app,.onrender.com,localhost,127.0.0.1').split(',')]

# Security for HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# CORS for Vercel frontend
CORS_ALLOWED_ORIGINS = []
CORS_ALLOWED_ORIGIN_REGEXES = [r'^https://.*\.vercel\.app$', r'^https://.*\.onrender\.com$']
CSRF_TRUSTED_ORIGINS = ['https://*.vercel.app', 'https://*.onrender.com']

# WhiteNoise for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Step 3: Deploy Using Render Blueprint

#### Option A: Deploy via Blueprint (Recommended - Automated)

1. **Go to Render Dashboard:**
   - Navigate to https://dashboard.render.com

2. **Create Blueprint Deployment:**
   - Click `New` → `Blueprint`
   - Select your GitHub repository: `susancodex/Hospital_Management_System`
   - Render auto-detects `render.yaml`
   - Review the blueprint configuration

3. **Configure Environment Variables:**

   In the Blueprint settings, set these variables:

   | Variable | Value | Description |
   |----------|-------|-------------|
   | `SECRET_KEY` | `[Generate in Render]` | Django secret key (Render auto-generates) |
   | `DEBUG` | `False` | Disable debug mode in production |
   | `PYTHON_VERSION` | `3.12.7` | Python runtime version |
   | `ALLOWED_HOSTS` | `.onrender.com,localhost,127.0.0.1` | Allowed host domains |
   | `CORS_ALLOWED_ORIGIN_REGEXES` | `^https://.*\.vercel\.app$,^https://.*\.onrender\.com$` | Allow Vercel frontend |
   | `CSRF_TRUSTED_ORIGINS` | `https://*.vercel.app,https://*.onrender.com` | CSRF safe origins |
   | `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string (see Step 4) |

4. **Click "Deploy"** - Render will:
   - Build the backend service
   - Run migrations (`python manage.py migrate`)
   - Collect static files
   - Start Gunicorn server

#### Option B: Manual Configuration (If Blueprint Fails)

1. **Create Web Service Manually:**
   - Click `New` → `Web Service`
   - Connect GitHub repo
   - Name: `hospital-management-backend`
   - Runtime: `Python`
   - Build Command:
     ```bash
     pip install -r backend/requirements.txt
     cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput
     ```
   - Start Command:
     ```bash
     cd backend && gunicorn hospital_system.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
     ```

2. **Set Environment Variables:**
   - Same table as above

### Step 4: Set Up PostgreSQL Database (Production)

**Option A: Render PostgreSQL (Recommended)**

1. **Create PostgreSQL Database:**
   - In Render Dashboard: `New` → `PostgreSQL`
   - Database name: `hospital_db`
   - Region: `Oregon` (or your preferred region)
   - Plan: `Free` (if available in your region)

2. **Connect Database to Backend Service:**
   - Once DB is created, copy the **External Database URL**
   - Go to Backend Service → `Environment`
   - Add new environment variable:
     - Key: `DATABASE_URL`
     - Value: (paste the connection string)
   - Click `Save` and service auto-redeploys

3. **Verify Database Connection:**
   ```bash
   # After deployment, check logs:
   # Should see: "No changes detected in app 'core'" (migrations complete)
   ```

**Option B: Use Existing SQLite (Development Only)**

If not setting `DATABASE_URL`, Django defaults to SQLite. This is fine for testing but **NOT recommended for production** because:
- SQLite doesn't persist between deployments on free tier
- No backup capability
- Poor concurrency handling

### Step 5: Verify Backend Deployment

After deployment completes (5-15 minutes):

1. **Check Health Endpoint:**
   ```bash
   curl https://hospital-management-backend.onrender.com/api/
   ```
   Should return API response (not 500 error)

2. **Check Render Logs:**
   - Dashboard → Backend Service → Logs
   - Look for:
     ```
     Running migrations...
     Running collectstatic...
     [YYYY-MM-DD HH:MM:SS +0000] [12345] [INFO] Listening at: 0.0.0.0:10000
     ```

3. **Database Connection Verification:**
   - Logs should show no database errors
   - If you see "FATAL: role 'root' does not exist", check `DATABASE_URL` format

4. **Static Files:**
   - Visit: `https://hospital-management-backend.onrender.com/static/admin/css/base.css`
   - Should load the CSS file (not 404)

---

## 🌐 Frontend Deployment (Vercel)

### Prerequisites
- GitHub repository with code pushed
- Vercel account (free or paid)
- Deployed backend URL (e.g., `https://hospital-management-backend.onrender.com`)

### Step 1: Verify Frontend Configuration

Your `frontend/vite.config.js` is correct:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
```

Your `vercel.json` is properly configured:

```json
{
  "framework": "vite",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

✅ **Framework Detection**: Vite is properly configured
✅ **SPA Fallback**: All routes redirect to `index.html` (prevents 404 on page refresh)
✅ **Build Output**: `dist` directory matches Vite output

### Step 2: Verify API Client Configuration

Your `frontend/src/api/client.js` properly handles environment variables:

```javascript
const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const fallback = 'http://localhost:8000/api';
  const raw = configured || fallback;
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // ... JWT token handling ...
});
```

✅ **Environment Variable Support**: Uses `VITE_API_BASE_URL`
✅ **Fallback**: Works offline with localhost
✅ **JWT Integration**: Automatically adds auth tokens

### Step 3: Deploy to Vercel

#### Option A: Import from GitHub (Easiest)

1. **Go to Vercel:**
   - https://vercel.com/dashboard

2. **Import Project:**
   - Click `Add New` → `Project`
   - Click `Import Git Repository`
   - Search for: `Hospital_Management_System`
   - Select repo and click `Import`

3. **Vercel Auto-Detects Configuration:**
   - **Framework Preset**: `Vite` ✅
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build` ✅
   - **Output Directory**: `dist` ✅

4. **Set Environment Variables:**

   | Variable | Value |
   |----------|-------|
   | `VITE_API_BASE_URL` | `https://hospital-management-backend.onrender.com/api` |

   ⚠️ **IMPORTANT**: Replace with your actual Render backend URL!

5. **Click "Deploy"** - Vercel will:
   - Install npm dependencies
   - Run `npm run build`
   - Deploy the `dist` folder
   - Assign you a `*.vercel.app` domain

#### Option B: Manual Configuration

1. **Create `vercel.json`** (already present):
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "framework": "vite",
     "installCommand": "npm install",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "routes": [
       { "handle": "filesystem" },
       { "src": "/.*", "dest": "/index.html" }
     ]
   }
   ```

2. **Configure Project:**
   - Root Directory: `frontend`
   - Add `VITE_API_BASE_URL` environment variable

3. **Deploy**

### Step 4: Verify Frontend Deployment

After deployment (2-5 minutes):

1. **Check Vercel Deployment:**
   - Dashboard shows "Production: Ready ✓"
   - Green checkmark next to commit

2. **Visit Frontend URL:**
   - Click "Visit" or go to your `.vercel.app` domain
   - Should see the hospital management dashboard
   - NOT a blank page or 404

3. **Check Network Requests:**
   - Open Browser DevTools → Network tab
   - Try to log in or navigate
   - Verify API calls go to **Render URL** (not localhost):
     ```
     https://hospital-management-backend.onrender.com/api/token/
     ```

4. **Check Browser Console:**
   - No `CORS` errors
   - No `network` errors for API calls
   - Any errors? See troubleshooting below

---

## ⚠️ Troubleshooting

### Backend Issues

#### 1. **Build Fails - "gunicorn not found"**

**Cause**: Dependencies not installed in build process

**Fix**:
```yaml
# In render.yaml, ensure pip install runs:
buildCommand: |
  pip install -r backend/requirements.txt
  cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

**Verify** `requirements.txt` has:
```
gunicorn>=22.0.0
```

---

#### 2. **500 Error on API Endpoint**

**Cause**: Various - check logs

**Fix - Check Logs:**
```bash
# In Render Dashboard:
# Backend Service → Logs
# Look for specific error
```

**Common Causes & Fixes:**

- **Database connection error** → Set `DATABASE_URL` environment variable
- **Secret key issue** → Ensure `SECRET_KEY` is set (Render auto-generates)
- **Import error** → Check `pip install -r backend/requirements.txt` succeeded
- **Migration issue** → View logs for migration errors

---

#### 3. **Static Files Return 404**

**Cause**: `collectstatic` failed or wasn't run

**Fix**:
1. Ensure build command includes:
   ```bash
   python manage.py collectstatic --noinput
   ```

2. Verify `settings.py`:
   ```python
   STATIC_URL = '/static/'
   STATIC_ROOT = os.path.join(BASE_DIR, 'static')
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   ```

3. Redeploy service

---

#### 4. **CORS Error from Frontend**

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Fix - Set Environment Variables:**

```
CORS_ALLOWED_ORIGINS = https://your-vercel-app.vercel.app
CORS_ALLOWED_ORIGIN_REGEXES = ^https://.*\.vercel\.app$
CSRF_TRUSTED_ORIGINS = https://*.vercel.app
```

**Verify in `settings.py`**:
```python
CORS_ALLOWED_ORIGIN_REGEXES = [
    pattern.strip() for pattern in os.environ.get(
        'CORS_ALLOWED_ORIGIN_REGEXES',
        r'^https://.*\.vercel\.app$,^https://.*\.onrender\.com$',
    ).split(',') if pattern.strip()
]
```

---

#### 5. **Migrations Not Running**

**Error**: "Table doesn't exist" or model errors

**Fix**:
1. Ensure migrations are part of build:
   ```bash
   python manage.py migrate --noinput
   ```

2. If custom migrations were added, commit them:
   ```bash
   git add backend/core/migrations/
   git commit -m "Add custom migrations"
   git push
   ```

3. Redeploy to trigger build

---

#### 6. **Service Spins Down (Render Free Tier)**

**Cause**: Render free tier spins down inactive services after 15 minutes

**Solution**: Upgrade to Paid or use a monitoring service:
```bash
# Option 1: Use an uptime monitor (like Uptime Robot)
# Check your backend every 5 minutes to prevent spin-down

# Option 2: Upgrade to Paid on Render (starts at $7/month)
```

---

### Frontend Issues

#### 1. **Blank Page After Deploy**

**Cause**: Build failed or wrong root directory

**Fix**:
1. Check Vercel logs:
   - Dashboard → Deployments → Click failed build
   - Look for errors in "Build Logs"

2. Verify root directory:
   - Project Settings → General
   - Ensure Root Directory is `./frontend` (not empty)

3. Verify `vercel.json`:
   ```json
   {
     "framework": "vite",
     "outputDirectory": "dist"
   }
   ```

4. Redeploy

---

#### 2. **Framework Not Detected Error**

**Cause**: Vercel can't find framework config

**Fix**:
1. Ensure `vercel.json` exists in repo root:
   ```json
   {
     "framework": "vite",
     "installCommand": "npm install",
     "buildCommand": "npm run build",
     "outputDirectory": "dist"
   }
   ```

2. Ensure `package.json` exists in `frontend/`:
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```

3. Redeploy or manually select "Vite" framework

---

#### 3. **API Calls Return 404 or Empty Response**

**Cause**: `VITE_API_BASE_URL` not set or wrong value

**Fix**:
1. Set environment variable in Vercel:
   - Project Settings → Environment Variables
   - Add: `VITE_API_BASE_URL=https://hospital-management-backend.onrender.com/api`

2. Verify in browser:
   - DevTools → Application → check if `VITE_API_BASE_URL` is visible
   - Actually, check Network tab for actual API URLs

3. Check frontend code:
   ```javascript
   // src/api/client.js should show:
   console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
   ```

4. Redeploy after setting env var

---

#### 4. **Login/Auth Not Working**

**Cause**: API calls going to wrong backend or CORS blocked

**Fix**:
1. Open DevTools → Network
2. Attempt login and check:
   - Request URL should be: `https://hospital-management-backend.onrender.com/api/token/`
   - NOT: `http://localhost:8000/api/`
   - Check Response headers for CORS errors

3. If CORS error appears:
   - Backend hasn't set proper CORS headers
   - Set backend environment variables (see Backend CORS fix)

---

#### 5. **Page Refresh Shows 404**

**Cause**: SPA routing not configured

**Fix - Verify `vercel.json`**:
```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

This ensures all routes redirect to `index.html` for React Router to handle.

---

#### 6. **Very Slow Build or Timeout**

**Cause**: Too many dependencies or build issues

**Fix**:
1. Clean cache:
   - Vercel Dashboard → Settings → Git
   - Click "Disconnect Git"
   - Reconnect (forces clean rebuild)

2. Optimize dependencies:
   - Check `package.json` for unused packages
   - Run: `npm audit` to find issues

3. Increase timeout (Vercel Pro only):
   - Default: 45 seconds
   - Pro: 1 hour

---

### Common "Both Frontend & Backend" Issues

#### API Response Shows HTML Instead of JSON

**Cause**: Backend is serving HTML error page

**Fix**:
1. Backend logs show 500 error
2. Check specific backend error message
3. Use solutions from "Backend 500 Error" section above

---

#### HTTPS/SSL Mismatch

**Error**: "Mixed Content" warning (HTTP API called from HTTPS frontend)

**Fix**:
1. Ensure backend URL uses `https://` in `VITE_API_BASE_URL`
   ```
   https://hospital-management-backend.onrender.com/api
   (NOT http://)
   ```

2. Backend settings must have SSL enabled:
   ```python
   SECURE_SSL_REDIRECT = not DEBUG
   ```

---

#### "Invalid token" or Unauthorized on Every Request

**Cause**: JWT token not being sent or wrong secret

**Fix**:
1. Check `src/api/client.js` adds Bearer token
2. Verify backend uses same JWT secret (usually auto-generated)
3. Clear localStorage and try fresh login:
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

---

## ✅ Post-Deployment Verification

### Checklist

- [ ] **Backend Service Health**
  ```bash
  curl https://hospital-management-backend.onrender.com/api/
  # Should return JSON, not 500 error
  ```

- [ ] **Frontend Loads**
  - Visit `https://your-app.vercel.app`
  - Should see dashboard (not blank page)

- [ ] **Login Works**
  - Try registering a new account
  - Check DevTools → Network for API call success

- [ ] **API Calls Go to Render**
  - DevTools → Network
  - All requests should show Render backend URL
  - NOT localhost

- [ ] **Static Files Load**
  - Backend admin CSS: `https://hospital-management-backend.onrender.com/static/admin/css/base.css`
  - Should load (not 404)

- [ ] **Database Connected**
  - Create a patient/appointment
  - Refresh page - data persists
  - (Indicates database is working)

- [ ] **CORS Headers Present**
  - DevTools → Network → Response Headers
  - Should see: `Access-Control-Allow-Origin: https://your-vercel-app.vercel.app`

---

## 📱 Environment Variables Summary

### Backend (Render)

| Var | Value | Type |
|-----|-------|------|
| `SECRET_KEY` | Auto-generated by Render | String |
| `DEBUG` | `False` | Boolean |
| `PYTHON_VERSION` | `3.12.7` | String |
| `ALLOWED_HOSTS` | `.onrender.com,localhost,127.0.0.1` | CSV |
| `CORS_ALLOWED_ORIGIN_REGEXES` | `^https://.*\.vercel\.app$,^https://.*\.onrender\.com$` | Regex |
| `CSRF_TRUSTED_ORIGINS` | `https://*.vercel.app,https://*.onrender.com` | CSV |
| `DATABASE_URL` | `postgresql://user:pass@host/db` | URL |

### Frontend (Vercel)

| Var | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://hospital-management-backend.onrender.com/api` |

---

## 🎯 Deploy Summary

### For First-Time Setup:

1. **Backend:**
   ```bash
   # 1. Ensure all code is pushed to GitHub
   git push origin main
   
   # 2. In Render: New → Blueprint → Connect repo
   # 3. Apply blueprint, set env vars
   # 4. Wait 5-15 min for build
   ```

2. **Frontend:**
   ```bash
   # 1. In Vercel: Add Project → Import from GitHub
   # 2. Set VITE_API_BASE_URL env var
   # 3. Deploy (2-5 min)
   ```

3. **Verify:**
   - Backend responds to API calls
   - Frontend loads without errors
   - API calls go to Render (not localhost)

### For Updates:

1. Make code changes locally
2. Commit and push: `git push origin main`
3. Both Render and Vercel auto-deploy (auto-deploy enabled in config)
4. Check deployment logs to verify success

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/
- **Vite Production Guide**: https://vitejs.dev/guide/build.html

---

**Last Updated**: 2025-04-24
**Version**: 1.0 (Complete)
