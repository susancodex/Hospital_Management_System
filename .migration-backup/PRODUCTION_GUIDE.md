# Production Deployment Guide

This guide ensures your Hospital Management System is properly deployed and maintained in production.

## Pre-Deployment Checklist

- [ ] All tests passing (`python manage.py test`)
- [ ] Environment variables configured
- [ ] Secret key generated and set
- [ ] Database backed up
- [ ] SSL/HTTPS configured
- [ ] CORS settings verified
- [ ] Static files collected
- [ ] Django migrations applied

## Render Deployment (Current Setup)

### Initial Setup

Your application is configured for Render deployment via `render.yaml`.

1. **Connect GitHub Repository**
   - Sign in to Render
   - Click "New +" → "Web Service"
   - Select your GitHub repository
   - Render auto-detects `render.yaml`

2. **Set Environment Variables** (Render Dashboard)
   ```
   SECRET_KEY=<generate-new-secure-key>
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com,.vercel.app
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.vercel\.app$
   CSRF_TRUSTED_ORIGINS=https://*.vercel.app
   ```

3. **Database Configuration**
   - Render auto-provisions PostgreSQL
   - Or connect existing PostgreSQL
   - Set `DATABASE_URL` if using external database

4. **Deploy**
   - Push to main branch
   - Render auto-builds and deploys
   - Check deployment logs in Render dashboard

### Monitoring Render Deployment

```bash
# View live logs
render logs hospital-management-backend

# Check service status
render ps hospital-management-backend

# SSH into service (paid plans only)
render shell hospital-management-backend
```

## Vercel Frontend Deployment

### Setup Frontend on Vercel

1. **Import Repository**
   - Go to Vercel → Import Project
   - Select your GitHub repo
   - Set root directory: `frontend`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-render-backend.onrender.com/api
   ```

3. **Deploy**
   - Vercel auto-deploys on push to main
   - Or manual: `vercel --prod`

### Frontend Environment

```env
# frontend/.env.production
VITE_API_URL=https://your-backend.onrender.com/api
```

## Docker Production Deployment

### Build Production Image

```bash
# Build
docker build -t hospital-management:latest .

# Tag for registry
docker tag hospital-management:latest your-registry/hospital-management:latest

# Push
docker push your-registry/hospital-management:latest
```

### Run Production Container

```bash
docker run -d \
  --name hospital-api \
  -p 8000:8000 \
  -e SECRET_KEY="your-production-key" \
  -e DEBUG="False" \
  -e DATABASE_URL="postgresql://user:pass@db-host:5432/db" \
  -e ALLOWED_HOSTS="yourdomain.com" \
  -e CORS_ALLOWED_ORIGINS="https://frontend-domain.com" \
  your-registry/hospital-management:latest
```

### Docker Compose for Production

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hospital_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    image: your-registry/hospital-management:latest
    environment:
      DEBUG: "False"
      SECRET_KEY: ${SECRET_KEY}
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/hospital_prod
    ports:
      - "8000:8000"
    depends_on:
      - db
    restart: always

volumes:
  postgres_data:
```

## Security in Production

### Django Security Checklist

```bash
# Check security issues
python manage.py check --deploy

# Expected output: 0 errors
```

### SSL/HTTPS

- Render auto-provides SSL
- Enable HSTS: Add to `settings.py`
  ```python
  SECURE_HSTS_SECONDS = 31536000
  SECURE_HSTS_INCLUDE_SUBDOMAINS = True
  SECURE_HSTS_PRELOAD = True
  ```

### Secret Key

```bash
# Generate new secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Database Security

- Use strong passwords
- Enable SSL for database connections
- Regular backups
- IP whitelist if possible

### CORS & CSRF

```python
# Verify settings.py
CORS_ALLOWED_ORIGINS = [
    "https://frontend.vercel.app",
]
CSRF_TRUSTED_ORIGINS = [
    "https://frontend.vercel.app",
]
```

## Monitoring & Logging

### Application Logs

```bash
# Render
render logs hospital-management-backend

# Docker
docker logs hospital-api -f
```

### Database Monitoring

```bash
# Connect to PostgreSQL
psql postgresql://user:pass@host:5432/hospital_db

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('hospital_db'));
```

### Performance Monitoring

- **Render**: Dashboard shows CPU, RAM, requests
- **Vercel**: Analytics dashboard
- **Custom**: Add logging to views

```python
import logging
logger = logging.getLogger(__name__)

def get_users(request):
    logger.info(f"Getting users for {request.user}")
    # ...
```

## Database Backup & Recovery

### Automated Backups

**Render PostgreSQL**:
- Auto-backups enabled by default
- Access in Render dashboard

### Manual Backup

```bash
# Backup
pg_dump DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql DATABASE_URL < backup_20240501.sql

# Verify
psql DATABASE_URL -c "\dt"
```

## Scaling Considerations

### When to Scale

- Response time > 2 seconds
- CPU consistently > 80%
- Memory usage > 90%
- Request errors increasing

### Scaling Options

**Render**:
- Upgrade to standard plan
- Increase worker count in `render.yaml`

**Docker/Kubernetes**:
- Horizontal scaling with load balancer
- Multiple replica containers

## Database Migrations in Production

### Before Migration

```bash
# Test locally
python manage.py migrate --plan core

# Backup production database
pg_dump DATABASE_URL > backup_pre_migration.sql
```

### Apply Migration

```bash
# Render auto-runs in buildCommand
# Or manually via SSH:
render shell hospital-management-backend
python manage.py migrate
```

### Verify Migration

```bash
# Check migration status
python manage.py showmigrations

# Check schema
psql DATABASE_URL -c "\d auth_user"
```

## Troubleshooting Production Issues

### 500 Error

```bash
# Check logs
render logs hospital-management-backend

# Verify migrations
python manage.py showmigrations

# Check database connection
python manage.py dbshell
```

### Slow Performance

```bash
# Check slow queries
django-extensions runserver_plus --pdb-on-exception

# Check database indexes
psql -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;"

# Monitor resource usage
render ps hospital-management-backend
```

### Database Connection Issues

```bash
# Verify URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## Maintenance Windows

- Schedule during low traffic periods
- Notify users beforehand
- Have rollback plan
- Test changes thoroughly first

## Disaster Recovery

### Database Restore

```bash
# From backup file
psql postgresql://user:pass@new-host:5432/db < backup.sql

# Verify
psql postgresql://user:pass@new-host:5432/db -c "SELECT COUNT(*) FROM core_user;"
```

### Application Rollback

```bash
# Render: Redeploy previous commit
git revert HEAD
git push origin main

# Docker: Pull previous image
docker pull your-registry/hospital-management:v1.0.0
```

## Performance Optimization

### Backend
- Enable query caching
- Use database indexes
- Implement pagination
- Optimize N+1 queries

### Frontend
- Use Vercel edge caching
- Enable gzip compression
- Optimize bundle size

## Maintenance Schedule

- **Daily**: Check error logs
- **Weekly**: Monitor resource usage
- **Monthly**: Review performance metrics
- **Quarterly**: Security audit
- **Yearly**: Major version updates

## Contact & Support

- **Render Support**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/

---

**Last Updated**: May 2026  
**Status**: Active ✅
