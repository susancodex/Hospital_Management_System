# 🔧 Deployment Troubleshooting Decision Tree

## Backend Troubleshooting

```
┌─ Backend Issue ──────────────────────────────────┐
│                                                  │
├─→ "Build Failed" ───────────────────┐           │
│   │                                  │           │
│   ├─→ Check Render Logs              │           │
│   │   └─→ Shows "pip: command not found"         │
│   │       └─→ FIX: Add to build command:         │
│   │           pip install -r backend/requirements.txt
│   │                                  │           │
│   └─→ Shows "gunicorn not found"     │           │
│       └─→ FIX: Add gunicorn to requirements.txt   │
│           gunicorn>=22.0.0            │           │
│                                       │           │
├─→ "Service Crashed" ──────────────────┐         │
│   │                                   │         │
│   ├─→ Check Render Logs               │         │
│   │   │                                │         │
│   │   ├─→ Shows "No such table"        │         │
│   │   │   └─→ FIX: Set DATABASE_URL env var      │
│   │   │       and redeploy                       │
│   │   │                                │         │
│   │   ├─→ Shows "SECRET_KEY not set"  │         │
│   │   │   └─→ FIX: Render auto-generates SECRET_KEY
│   │   │       Check Environment tab   │         │
│   │   │                                │         │
│   │   ├─→ Shows "Permission denied"   │         │
│   │   │   └─→ FIX: Database credentials wrong    │
│   │   │       Check DATABASE_URL format:         │
│   │   │       postgresql://user:pass@host/db     │
│   │   │                                │         │
│   │   └─→ Shows other error           │         │
│   │       └─→ Share full error message │         │
│   │           Search Render/Django docs          │
│   │                                   │         │
│   └─→ No logs shown                   │         │
│       └─→ Service spinning down (free tier)      │
│           └─→ FIX: Upgrade to paid or set up     │
│               uptime monitor                     │
│                                       │         │
├─→ "API Returning 500 Error" ──────────┐        │
│   │                                   │        │
│   ├─→ Check exact error in logs       │        │
│   │   (Render → Backend → Logs)       │        │
│   │                                   │        │
│   └─→ Common causes:                  │        │
│       ├─→ "No such column" → Database migration failed
│       ├─→ "Import error" → requirements.txt missing package
│       ├─→ "Connection refused" → DATABASE_URL wrong
│       └─→ Other → See error message   │        │
│                                       │        │
├─→ "Static Files Return 404" ──────────┐       │
│   │                                   │       │
│   ├─→ Check logs for "collectstatic" │       │
│   │   └─→ Should show: "                       │
│   │       Running collectstatic..."  │       │
│   │                                   │       │
│   └─→ FIX:                            │       │
│       ├─→ Verify settings.py has:    │       │
│       │   STATIC_URL = '/static/'    │       │
│       │   STATIC_ROOT = os.path.join(BASE_DIR, 'static')
│       │   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
│       │                                │       │
│       └─→ Ensure build cmd has:      │       │
│           python manage.py collectstatic --noinput
│                                       │       │
├─→ "CORS Error from Frontend" ─────────┐      │
│   Error: "CORS policy blocked"         │      │
│   │                                   │      │
│   ├─→ Check Render env vars:         │      │
│   │   ├─→ CORS_ALLOWED_ORIGINS = [Vercel URL]
│   │   ├─→ CORS_ALLOWED_ORIGIN_REGEXES = ^https://.*\.vercel\.app$
│   │   └─→ CSRF_TRUSTED_ORIGINS = https://*.vercel.app
│   │                                   │      │
│   ├─→ Redeploy service               │      │
│   │   └─→ Changes take effect only on redeploy
│   │                                   │      │
│   └─→ Verify frontend can reach:     │      │
│       curl https://backend-url/api/   │      │
│                                       │      │
├─→ "Database Connection Failed" ───────┐     │
│   │                                   │     │
│   ├─→ Is DATABASE_URL set?           │     │
│   │   └─→ Check Render env vars      │     │
│   │       If not set → Backend uses SQLite (OK for dev)
│   │                                   │     │
│   ├─→ Is DATABASE_URL format correct?│     │
│   │   └─→ Should be:                 │     │
│   │       postgresql://user:password@host:5432/database
│   │                                   │     │
│   ├─→ Does database exist?           │     │
│   │   └─→ Go to Render PostgreSQL    │     │
│   │       Verify it exists           │     │
│   │                                   │     │
│   └─→ Redeploy with DATABASE_URL set │     │
│                                       │     │
└─→ "Health Check Failing" ─────────────┐    │
    │                                   │    │
    ├─→ Render periodically checks /api/ endpoint
    │   If fails → service marked unhealthy    │
    │                                   │    │
    ├─→ Check if /api/ returns 200 OK  │    │
    │   curl https://backend-url/api/  │    │
    │   Should NOT return 500          │    │
    │                                   │    │
    └─→ Fix underlying backend issue   │    │
        (See other categories above)   │    │
```

---

## Frontend Troubleshooting

```
┌─ Frontend Issue ──────────────────────────────┐
│                                               │
├─→ "Build Failed" ──────────────────┐         │
│   │                                │         │
│   ├─→ Check Vercel Build Logs      │         │
│   │   (Deployments → Click build → View Logs)
│   │                                │         │
│   ├─→ Shows "npm ERR!"             │         │
│   │   └─→ FIX: Check package.json  │         │
│   │       ├─→ All required packages present?
│   │       └─→ Run locally: npm install
│   │                                │         │
│   ├─→ Shows "Command not found"    │         │
│   │   └─→ FIX: Verify vercel.json  │         │
│   │       ├─→ buildCommand: "npm run build" ✓
│   │       └─→ outputDirectory: "dist" ✓     │
│   │                                │         │
│   └─→ Shows "Vite build error"     │         │
│       └─→ Usually missing env var  │         │
│           See "Blank Page" below    │         │
│                                    │         │
├─→ "Blank Page" ──────────────────────┐      │
│   After deploy, see blank page       │      │
│   │                                  │      │
│   ├─→ Check DevTools Console (F12)  │      │
│   │   │                               │      │
│   │   ├─→ See JavaScript errors?    │      │
│   │   │   └─→ Common: "VITE_API_BASE_URL undefined"
│   │   │       FIX: Set env var in Vercel  │
│   │   │                               │      │
│   │   ├─→ See network errors?        │      │
│   │   │   └─→ API endpoints returning 404/500
│   │   │       FIX: Check API_BASE_URL value
│   │   │                               │      │
│   │   └─→ No errors, just blank?    │      │
│   │       └─→ index.html loaded?    │      │
│   │           Check Network tab      │      │
│   │                                  │      │
│   ├─→ Check Vercel Build successful? │     │
│   │   └─→ Should show "Ready ✓"     │      │
│   │       If not → See "Build Failed" above
│   │                                  │      │
│   ├─→ Check vercel.json config      │      │
│   │   └─→ Should have:              │      │
│   │       {                         │      │
│   │         "framework": "vite",    │      │
│   │         "outputDirectory": "dist",
│   │         "routes": [{...}]       │      │
│   │       }                         │      │
│   │                                  │      │
│   └─→ Redeploy:                     │      │
│       ├─→ Vercel → Deployments     │      │
│       └─→ Click latest → "Redeploy"│      │
│                                    │      │
├─→ "Cannot Find Framework" ──────────┐     │
│   "framework not detected"           │     │
│   │                                  │     │
│   ├─→ FIX 1: Update vercel.json     │     │
│   │   └─→ Add: "framework": "vite"  │     │
│   │                                  │     │
│   ├─→ FIX 2: Manual Configuration  │     │
│   │   ├─→ Vercel → Project Settings│     │
│   │   ├─→ Framework: Select "Vite" │     │
│   │   └─→ Save & Redeploy           │     │
│   │                                  │     │
│   └─→ FIX 3: Wrong Root Directory  │     │
│       └─→ Should be: ./frontend     │     │
│           (Not empty, not /)         │     │
│                                    │      │
├─→ "API Calls Failing" ────────────────┐   │
│   Login/API returning errors          │   │
│   │                                   │   │
│   ├─→ Check DevTools Network tab    │   │
│   │   │                               │   │
│   │   ├─→ Request URL shows localhost?
│   │   │   └─→ FIX: Set VITE_API_BASE_URL env var
│   │   │       in Vercel project settings      │
│   │   │                               │   │
│   │   ├─→ Request URL shows Render?  │   │
│   │   │   But returns 404/500?        │   │
│   │   │   └─→ Backend issue!          │   │
│   │   │       See backend troubleshooting
│   │   │                               │   │
│   │   ├─→ See CORS error?            │   │
│   │   │   └─→ FIX: Set backend CORS env vars
│   │   │       and redeploy            │   │
│   │   │                               │   │
│   │   └─→ See "undefined" in request?│   │
│   │       └─→ VITE_API_BASE_URL not set
│   │                                   │   │
│   ├─→ Verify API client code         │   │
│   │   └─→ frontend/src/api/client.js │   │
│   │       Should use: import.meta.env.VITE_API_BASE_URL
│   │                                   │   │
│   └─→ Set correct VITE_API_BASE_URL │   │
│       Example: https://hospital-management-backend.onrender.com/api
│                                    │   │
├─→ "Page Refresh Shows 404" ─────────┐   │
│   Works fine, refresh = 404 error    │   │
│   (SPA routing issue)                 │   │
│   │                                   │   │
│   ├─→ Verify vercel.json routes     │   │
│   │   └─→ Should have:              │   │
│   │       {                         │   │
│   │         "routes": [            │   │
│   │           {"handle": "filesystem"},
│   │           {"src": "/.*", "dest": "/index.html"}
│   │         ]                       │   │
│   │       }                         │   │
│   │                                   │   │
│   └─→ FIX: Update vercel.json & redeploy
│                                    │   │
├─→ "Very Slow Build/Timeout" ────────┐   │
│   Build takes >40 seconds or times out │  │
│   │                                   │   │
│   ├─→ Check package.json            │   │
│   │   └─→ Run npm audit to find issues
│   │       $ npm audit               │   │
│   │                                   │   │
│   ├─→ Remove unused dependencies    │   │
│   │   $ npm prune                   │   │
│   │   $ npm install                 │   │
│   │                                   │   │
│   └─→ Force clean rebuild:          │   │
│       ├─→ Vercel Dashboard          │   │
│       ├─→ Settings → Git            │   │
│       ├─→ "Disconnect Git"          │   │
│       └─→ Reconnect (forces clean)  │   │
│                                    │   │
└─→ "Environment Variable Not Working"─┐   │
    Set VITE_API_BASE_URL but still undefined │
    │                                   │   │
    ├─→ FIX 1: Restart Vercel env parser │
    │   └─→ Redeploy project           │   │
    │                                   │   │
    ├─→ FIX 2: Verify env var was saved │
    │   └─→ Vercel → Project Settings  │   │
    │       → Environment Variables    │   │
    │       → Check VITE_API_BASE_URL exists
    │                                   │   │
    ├─→ FIX 3: Check variable name    │   │
    │   └─→ Must start with VITE_     │   │
    │       (VITE exposes vars to client)
    │                                   │   │
    └─→ FIX 4: Redeploy after setting │   │
        (Env vars only used during build) │
```

---

## Combined Frontend + Backend Issues

```
┌─ End-to-End Issue ────────────────────────────────┐
│                                                   │
├─→ "Login Not Working" ────────────────────┐      │
│   Everything looks fine, but can't log in  │      │
│   │                                        │      │
│   ├─→ Check DevTools Network              │      │
│   │   When clicking login:                │      │
│   │   │                                    │      │
│   │   ├─→ See request to Render URL?      │      │
│   │   │   └─→ Check response body        │      │
│   │   │       If error → Backend issue   │      │
│   │   │                                    │      │
│   │   ├─→ See request to localhost?      │      │
│   │   │   └─→ FIX: Set VITE_API_BASE_URL │      │
│   │   │       (pointing to Render)        │      │
│   │   │                                    │      │
│   │   └─→ See CORS error?                │      │
│   │       └─→ FIX: Backend CORS settings │      │
│   │           See Backend troubleshooting│      │
│   │                                        │      │
│   ├─→ Can request reach backend?          │      │
│   │   $ curl https://backend-url/api/token/
│   │   Should work (not refused)           │      │
│   │                                        │      │
│   └─→ Restart frontend:                  │      │
│       ├─→ Clear localStorage in DevTools │      │
│       ├─→ Hard refresh (Cmd+Shift+R)     │      │
│       └─→ Try login again                │      │
│                                           │      │
├─→ "Authenticated But API Returns 401" ───┐      │
│   Login successful, but can't fetch data  │      │
│   │                                       │      │
│   ├─→ Check token in DevTools            │      │
│   │   Application → LocalStorage         │      │
│   │   ├─→ access_token exists?           │      │
│   │   ├─→ refresh_token exists?          │      │
│   │   └─→ If empty → re-login            │      │
│   │                                       │      │
│   ├─→ Check API response status          │      │
│   │   DevTools → Network → API call      │      │
│   │   ├─→ 401: Token expired             │      │
│   │   │   → Refresh token not working    │      │
│   │   │                                   │      │
│   │   ├─→ 403: Forbidden                 │      │
│   │   │   → User doesn't have permission │      │
│   │   │                                   │      │
│   │   └─→ 500: Server error              │      │
│   │       → Backend crashed              │      │
│   │                                       │      │
│   └─→ Check if bearer token sent:        │      │
│       DevTools → Network → API call      │      │
│       Request Headers should show:       │      │
│       Authorization: Bearer [token]      │      │
│                                           │      │
├─→ "Mixed Content Warning" ────────────────┐     │
│   "Insecure request blocked"              │     │
│   Frontend: https, Backend: http          │     │
│   │                                       │     │
│   └─→ FIX: Use https in VITE_API_BASE_URL│     │
│       Change from: http://...             │     │
│       Change to:   https://...            │     │
│                                           │     │
├─→ "Data Not Persisting" ──────────────────┐     │
│   Create patient/data, refresh = gone     │     │
│   │                                       │     │
│   ├─→ Is data saved in backend DB?       │     │
│   │   └─→ Check backend logs              │     │
│   │       Should see database queries    │     │
│   │                                       │     │
│   ├─→ Is DATABASE_URL set?               │     │
│   │   └─→ Check Render backend env vars  │     │
│   │       If not set, using SQLite (volatile)
│   │                                       │     │
│   ├─→ Is database actually persisting?   │     │
│   │   └─→ Query database directly        │     │
│   │       $ psql [DATABASE_URL]          │     │
│   │                                       │     │
│   └─→ Set DATABASE_URL if not already    │     │
│       Redeploy backend                   │     │
│                                           │     │
└─→ "Everything Works Locally, Fails in Production"─┐
    Works on `localhost:3000/localhost:8000`       │
    But fails on deployed URLs                     │
    │                                              │
    ├─→ Check all environment variables          │
    │   ├─→ Backend: All set in Render?          │
    │   ├─→ Frontend: All set in Vercel?         │
    │   └─→ URLs point to deployed, not local    │
    │                                              │
    ├─→ Check CORS settings                      │
    │   ├─→ Frontend URL in backend CORS?        │
    │   └─→ Backend URL in frontend API client?  │
    │                                              │
    ├─→ Check database connectivity              │
    │   └─→ DATABASE_URL set for production DB?  │
    │                                              │
    └─→ Common reason: Still pointing to localhost
        $ grep localhost [frontend/src/api/client.js]
        Should NOT use localhost in production
```

---

## Quick Diagnosis

### "I need to know what's wrong fast"

**Step 1**: Check both dashboards
```
Render Dashboard   → Backend Service → Logs (look for red errors)
Vercel Dashboard   → Deployments → Click latest → Logs (look for red errors)
```

**Step 2**: Test the obvious
```bash
# Can backend reach API?
curl https://hospital-management-backend.onrender.com/api/

# Does frontend load?
Visit https://your-app.vercel.app in browser
```

**Step 3**: Check DevTools (F12) when using app
```
Console tab   → Any red errors?
Network tab   → Are API URLs going to Render or localhost?
```

**Step 4**: Based on findings
- Backend error → Fix in backend, push code, redeploy
- Frontend error → Fix in frontend, push code, redeploy
- API calling localhost → Set VITE_API_BASE_URL in Vercel
- CORS error → Set CORS variables in Render backend

---

## When to Redeploy

| Change | Backend | Frontend |
|--------|---------|----------|
| Edit `settings.py` | 🔄 | |
| Edit `.py` file | 🔄 | |
| Set env variable | 🔄 | 🔄 |
| Edit `vite.config.js` | | 🔄 |
| Edit React component | | 🔄 |
| Push to GitHub (auto-deploy on) | 🔄 Auto | 🔄 Auto |
| Manual redeploy | Dashboard button | Dashboard button |

---

## Still Stuck?

1. **Read the full error message** in logs
2. **Google the error** + "Django" or "React Vite"
3. **Check official docs**:
   - Django: https://docs.djangoproject.com
   - Render: https://render.com/docs
   - Vercel: https://vercel.com/docs
   - Vite: https://vitejs.dev/guide/
4. **Share full error** + logs when asking for help

---

**Last Updated**: 2025-04-24
