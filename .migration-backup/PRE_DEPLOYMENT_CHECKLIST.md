# Pre-Deployment Checklist

Use this checklist to ensure your Hospital Management System is ready for production deployment.

## ✅ Environment Setup

- [ ] `.env` file created from `.env.example`
- [ ] `SECRET_KEY` is set and secure (min 32 characters)
- [ ] `DEBUG` is set to `False`
- [ ] `DATABASE_URL` is configured
- [ ] All required environment variables are set

## ✅ Backend Verification

### Django Configuration
```bash
cd backend
python manage.py check --deploy
# Expected: System check identified 0 errors
```

- [ ] `python manage.py check --deploy` passes with 0 errors
- [ ] Database migrations applied: `python manage.py showmigrations`
- [ ] All migrations are marked as applied (no pending migrations)

### Static Files
```bash
python manage.py collectstatic --noinput
```

- [ ] Static files collected successfully
- [ ] `/backend/staticfiles/` directory created
- [ ] Admin CSS/JS loaded correctly

### Security
- [ ] `ALLOWED_HOSTS` includes your domain
- [ ] `CORS_ALLOWED_ORIGINS` set to frontend domain
- [ ] `CSRF_TRUSTED_ORIGINS` configured
- [ ] Secret key is not in `.env` file committed to git
- [ ] Database credentials not hardcoded

## ✅ Frontend Verification

### Build Check
```bash
cd frontend
npm run build
```

- [ ] Frontend builds successfully
- [ ] No build warnings
- [ ] `/frontend/dist/` directory created
- [ ] `VITE_API_URL` environment variable set

### API Connection
```bash
# In frontend/.env.production or environment
VITE_API_URL=https://your-backend-domain.com/api
```

- [ ] API URL points to backend domain
- [ ] HTTPS is enforced
- [ ] Trailing slash correct

## ✅ Docker Verification

### Image Build
```bash
docker build -t hospital-management:test .
```

- [ ] Docker image builds successfully
- [ ] No build errors
- [ ] Image size is reasonable (< 1GB)

### Container Run
```bash
docker run -p 8000:8000 \
  -e SECRET_KEY="test-key" \
  -e DEBUG="False" \
  -e DATABASE_URL="postgresql://..." \
  hospital-management:test
```

- [ ] Container starts successfully
- [ ] No startup errors in logs
- [ ] Health check passes: `curl http://localhost:8000/api/health/`

## ✅ Database Verification

### Connection Test
```bash
# Ensure PostgreSQL is running
psql $DATABASE_URL -c "SELECT 1;"
```

- [ ] Database connection works
- [ ] User has correct permissions
- [ ] All tables created by migrations

### Backup
```bash
pg_dump $DATABASE_URL > backup_pre_deploy.sql
```

- [ ] Database backed up
- [ ] Backup file is readable
- [ ] Backup stored safely

## ✅ API Testing

### Health Check
```bash
curl http://localhost:8000/api/health/
```

Response should be:
```json
{
  "status": "healthy",
  "message": "Hospital Management System API is running",
  "database": "connected"
}
```

- [ ] Health endpoint responds with 200 OK
- [ ] Database shows connected

### Authentication
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

- [ ] Login endpoint returns JWT tokens
- [ ] Access token format is correct

### Protected Endpoints
```bash
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <token>"
```

- [ ] Protected endpoints require authentication
- [ ] Valid tokens are accepted
- [ ] Invalid tokens return 401

## ✅ Frontend Testing

### Dev Server
```bash
cd frontend
npm run dev
```

- [ ] Frontend starts on correct port (5173)
- [ ] No build errors
- [ ] Can access http://localhost:5173

### Production Build
```bash
npm run build
npm run preview
```

- [ ] Build succeeds without errors
- [ ] Preview serves production build
- [ ] API calls work with correct endpoint

## ✅ Render Deployment

### render.yaml Verification
- [ ] `render.yaml` is valid YAML
- [ ] All required fields present
- [ ] Service name is correct
- [ ] Build and start commands are correct
- [ ] Python version matches requirements

### Environment Variables (Render Dashboard)
- [ ] `SECRET_KEY` is set
- [ ] `DEBUG` is `False`
- [ ] `DATABASE_URL` is configured (or auto-provisioned)
- [ ] `ALLOWED_HOSTS` includes `.onrender.com`
- [ ] `CORS_ALLOWED_ORIGINS` includes frontend domain
- [ ] All other required vars are set

### Pre-Deploy
- [ ] Latest code pushed to main branch
- [ ] All commits are clean
- [ ] No secrets in commit messages
- [ ] No `db.sqlite3` in commits

## ✅ Vercel Deployment (Frontend)

### vercel.json Verification
- [ ] `vercel.json` is valid JSON
- [ ] Build command is correct
- [ ] Output directory is correct (`dist`)
- [ ] Environment variables section complete

### Environment Variables (Vercel Dashboard)
- [ ] `VITE_API_URL` points to Render backend
- [ ] URL uses HTTPS
- [ ] URL includes `/api` path

## ✅ Final Checks

### Code Quality
```bash
# Backend lint
cd backend && python -m pylint core/ || true

# Frontend lint  
cd frontend && npm run lint || true
```

- [ ] No critical linting errors
- [ ] Code follows project style

### Performance
- [ ] Page load time < 3 seconds (local)
- [ ] API response time < 1 second
- [ ] No console errors
- [ ] No performance warnings

### Security
```bash
cd backend
python manage.py check --deploy
```

- [ ] Security check passes
- [ ] No credentials in code
- [ ] HTTPS configured
- [ ] CORS properly restricted

### Documentation
- [ ] README.md is accurate
- [ ] SETUP_SUMMARY.md reviewed
- [ ] PRODUCTION_GUIDE.md reviewed
- [ ] Environment variables documented

## ✅ Go/No-Go Decision

### Requirements for Go
- [ ] All items above are checked ✅
- [ ] Team approval obtained
- [ ] Backup strategy confirmed
- [ ] Rollback plan ready
- [ ] Monitoring configured

### If Any Item Unchecked
❌ **DO NOT DEPLOY** - Address issues first

---

## 🚀 Deployment Procedure

1. **Final Backup**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run this Checklist**
   - [ ] All items checked

3. **Deploy to Render**
   ```bash
   git add .
   git commit -m "Production release v1.0.0"
   git push origin main
   ```
   - Render auto-deploys after push

4. **Monitor Deployment**
   - Check Render dashboard for build status
   - Verify logs for errors
   - Test health endpoint

5. **Post-Deployment Verification**
   ```bash
   # Check health
   curl https://your-api.onrender.com/api/health/
   
   # Check API
   curl https://your-api.onrender.com/api/users/ \
     -H "Authorization: Bearer <token>"
   ```

---

## 🆘 Rollback Plan

If deployment fails:

```bash
# View recent commits
git log --oneline | head -5

# Rollback to previous version
git revert HEAD
git push origin main

# Or restore from backup
pg_restore -d hospital_db backup_$(date +%Y%m%d).sql
```

---

**Last Updated**: May 2026  
**Version**: 1.0.0
