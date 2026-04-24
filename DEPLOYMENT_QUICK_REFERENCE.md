# 🚀 Deployment Quick Reference Card

## Phase 1: Pre-Deployment Checklist

- [ ] Code pushed to GitHub: `git push origin main`
- [ ] All config files present:
  - [ ] `backend/requirements.txt`
  - [ ] `backend/hospital_system/settings.py`
  - [ ] `render.yaml`
  - [ ] `frontend/package.json`
  - [ ] `frontend/vite.config.js`
  - [ ] `vercel.json`
- [ ] Database plan decided:
  - [ ] Use Render PostgreSQL (recommended)
  - [ ] OR use existing database
  - [ ] OR use SQLite (dev only)

---

## Phase 2: Deploy Backend (Render)

### Quick Steps:

1. **Go to**: https://dashboard.render.com
2. **Click**: `New` → `Blueprint`
3. **Select**: Your GitHub repo
4. **Fill Environment Variables**:
   ```
   SECRET_KEY              → [Let Render auto-generate]
   DEBUG                   → False
   PYTHON_VERSION          → 3.12.7
   ALLOWED_HOSTS           → .onrender.com,localhost,127.0.0.1
   CORS_ALLOWED_ORIGIN...  → ^https://.*\.vercel\.app$,^https://.*\.onrender\.com$
   CSRF_TRUSTED_ORIGINS    → https://*.vercel.app,https://*.onrender.com
   DATABASE_URL            → [Set after DB creation - see Phase 2.5]
   ```

5. **Click**: `Deploy`
6. **Wait**: 5-15 minutes for build to complete

### Phase 2.5: Connect Database (if not SQLite)

1. **Create Render PostgreSQL**:
   - Render Dashboard → `New` → `PostgreSQL`
   - Name: `hospital_db`
   - Plan: Free
   - Copy "External Database URL"

2. **Set DATABASE_URL in Backend Service**:
   - Render Dashboard → Backend Service → Environment
   - Add: `DATABASE_URL` = (paste the URL)
   - Service auto-redeploys

### Check Backend Health:
```bash
# Should return JSON, not error:
curl https://hospital-management-backend.onrender.com/api/

# Check logs for errors:
# Render Dashboard → Backend → Logs
```

**Expected log messages**:
```
Running migrations...
Running collectstatic...
[YYYY-MM-DD] [PID] [INFO] Listening at: 0.0.0.0:10000
```

---

## Phase 3: Deploy Frontend (Vercel)

### Quick Steps:

1. **Go to**: https://vercel.com/dashboard
2. **Click**: `Add New` → `Project`
3. **Click**: `Import Git Repository`
4. **Search & Select**: `Hospital_Management_System`
5. **Vercel auto-detects**:
   - Framework: Vite ✓
   - Build: `npm run build` ✓
   - Output: `dist` ✓
   - Root Directory: `./frontend` ✓

6. **Set Environment Variable**:
   ```
   VITE_API_BASE_URL  → https://hospital-management-backend.onrender.com/api
   ```
   ⚠️ Replace with YOUR actual backend URL!

7. **Click**: `Deploy`
8. **Wait**: 2-5 minutes

### Check Frontend Health:
- Visit your `.vercel.app` URL
- Should see dashboard (not blank page)
- Should NOT see 404 errors

---

## Phase 4: Verify End-to-End

### Test Checklist:

- [ ] **Backend API responds**:
  ```bash
  curl https://hospital-management-backend.onrender.com/api/
  ```

- [ ] **Frontend loads**:
  - Visit Vercel URL
  - Should see login page or dashboard

- [ ] **API calls target correct backend**:
  - Open DevTools (F12) → Network tab
  - Try to log in
  - Check Request URL shows: `https://hospital-management-backend.onrender.com/api/...`
  - NOT `http://localhost:8000/...`

- [ ] **No CORS errors**:
  - DevTools → Console
  - No errors containing "CORS" or "blocked by CORS policy"

- [ ] **Authentication works**:
  - Register or log in with existing account
  - Token stored in localStorage
  - Can navigate pages

- [ ] **Static files work**:
  ```bash
  curl https://hospital-management-backend.onrender.com/static/admin/css/base.css
  # Should return CSS (not 404)
  ```

---

## Phase 5: Common Fixes (If Anything Fails)

### Backend Won't Build

**Check**:
1. Render logs show the error
2. `requirements.txt` has `gunicorn>=22.0.0`
3. `backend/` folder exists with manage.py

**Fix**:
```yaml
# Ensure build command in render.yaml:
buildCommand: |
  pip install -r backend/requirements.txt
  cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

---

### Backend Returns 500 Error

**Check Logs**:
- Render Dashboard → Backend → Logs
- Look for specific error

**Common Causes**:
- `database not found` → Set DATABASE_URL
- `SECRET_KEY not set` → Render auto-generates (check env vars)
- `ImportError` → requirements.txt not installed
- `migration error` → Check logs, may need manual fix

**Fix**:
1. Fix the issue (based on log error)
2. Commit and push: `git push origin main`
3. Redeploy manually in Render (or auto-redeploy triggers)

---

### Frontend Is Blank Page

**Check**:
1. Vercel logs show successful build
2. Browser console (F12) for errors
3. Network tab shows files loading

**Common Causes**:
- Build command failed (check Vercel logs)
- Wrong root directory (should be `./frontend`)
- Environment variable not set

**Fix**:
1. Vercel Dashboard → Settings → Environment Variables
2. Verify `VITE_API_BASE_URL` is set correctly
3. Redeploy: Click "Deployments" → Click latest → "Redeploy"

---

### API Calls Return 404 or No Response

**Check**:
1. DevTools → Network → API call
2. Response shows what error
3. Request URL shows correct backend

**Common Causes**:
- Wrong `VITE_API_BASE_URL` → set correct Render URL
- CORS blocked → Backend env vars not set
- Backend not responding → check backend service

**Fix**:
1. Set `VITE_API_BASE_URL` in Vercel env vars (correct Render URL)
2. Set CORS variables in Render backend
3. Redeploy both frontend and backend

---

### Login/Auth Not Working

**Check**:
1. DevTools → Application → LocalStorage
   - `access_token` should exist after login
   - If empty → login failed

2. DevTools → Network → Response from login endpoint
   - Should contain `access` and `refresh` tokens
   - If not → backend rejected request

**Common Causes**:
- Credentials wrong
- Backend DB not connected
- JWT secret mismatch (unlikely if auto-generated)

**Fix**:
1. Check backend logs for login endpoint error
2. Ensure database is connected (`DATABASE_URL` set)
3. Try creating new account (register)

---

## Environment Variables Reference

### Backend (Set in Render):
```
SECRET_KEY              =  [Auto-generated by Render]
DEBUG                   =  False
PYTHON_VERSION          =  3.12.7
ALLOWED_HOSTS           =  .onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS    =  [Leave empty - uses REGEX]
CORS_ALLOWED_ORIGIN...  =  ^https://.*\.vercel\.app$,^https://.*\.onrender\.com$
CSRF_TRUSTED_ORIGINS    =  https://*.vercel.app,https://*.onrender.com
DATABASE_URL            =  postgresql://user:pass@host/db
```

### Frontend (Set in Vercel):
```
VITE_API_BASE_URL       =  https://hospital-management-backend.onrender.com/api
```

---

## Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Render** | https://dashboard.render.com | Deploy & manage backend |
| **Vercel** | https://vercel.com/dashboard | Deploy & manage frontend |
| **Your Backend API** | `https://hospital-management-backend.onrender.com/api/` | Test API health |
| **Your Frontend** | `https://your-project.vercel.app` | Visit app |
| **GitHub** | https://github.com/susancodex/Hospital_Management_System | Push code |

---

## Deployment Flow Diagram

```
┌─ Code on GitHub ─┐
│                  │
└────────┬─────────┘
         │
         ├─→ [Render Blueprint Deploys]
         │   ├─ Build: pip install → migrate → collectstatic
         │   └─ Start: gunicorn (Backend Service)
         │
         ├─→ [Create PostgreSQL]
         │   └─ Connect DATABASE_URL
         │
         └─→ [Vercel Import Repo]
             ├─ Build: npm install → npm run build
             └─ Deploy dist/ folder (Frontend Service)

Result:
✓ Backend API at: https://hospital-management-backend.onrender.com
✓ Frontend at: https://your-app.vercel.app
✓ Frontend calls Backend API
```

---

## After First Deployment

### Automatic Redeploys (Already Enabled):
- Every time you push to `main`, both services auto-redeploy
- Check status in Render & Vercel dashboards

### Manual Redeploy:
**Backend**:
- Render → Backend Service → Manual Redeploy

**Frontend**:
- Vercel → Deployments → Latest → Redeploy

### Update Environment Variables:
**Backend**:
- Render → Backend Service → Environment → Edit

**Frontend**:
- Vercel → Project Settings → Environment Variables → Edit

---

## Quick Debug Commands

```bash
# Test backend API
curl https://hospital-management-backend.onrender.com/api/

# Test backend static files
curl https://hospital-management-backend.onrender.com/static/admin/css/base.css

# Check if domain resolves
nslookup hospital-management-backend.onrender.com

# View Render service logs (if CLI installed)
render logs --service=hospital-management-backend
```

---

**Status**: Ready to Deploy! ✅

---

**Next Steps**:
1. Follow Phase 2 (Backend)
2. Follow Phase 3 (Frontend)
3. Follow Phase 4 (Verification)
4. If issues → Check Phase 5
