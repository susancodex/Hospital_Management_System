# 🖥️ Terminal Commands Reference Guide

Quick copy-paste commands for testing, deploying, and troubleshooting your Hospital Management System.

---

## 🏠 Local Development Commands

### Backend Setup & Testing

```bash
# Navigate to backend
cd backend

# Create virtual environment (first time)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (for local development)
cat > .env << EOF
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
EOF

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Start development server
python manage.py runserver
# Should see: Starting development server at http://127.0.0.1:8000/
```

### Frontend Setup & Testing

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file (for local development)
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000/api
EOF

# Start development server
npm run dev
# Should see: Local: http://localhost:5000

# Build for production (test build)
npm run build
# Should see: dist/ folder created with built files

# Preview production build locally
npm run preview
```

---

## 🧪 Testing API Endpoints Locally

### Basic Health Check

```bash
# Test backend is running
curl http://localhost:8000/api/

# Test with verbose output
curl -v http://localhost:8000/api/

# Test admin panel
curl http://localhost:8000/admin/
```

### Authentication Testing

```bash
# Register new user
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Login and get tokens
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Example response:
# {"access":"eyJ...","refresh":"eyJ..."}

# Save token for next requests
ACCESS_TOKEN="eyJ0eXAi..."

# Test authenticated request
curl -X GET http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### CRUD Operations Example

```bash
# Create patient
curl -X POST http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get all patients
curl -X GET http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get single patient
curl -X GET http://localhost:8000/api/patients/1/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Update patient
curl -X PUT http://localhost:8000/api/patients/1/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete patient
curl -X DELETE http://localhost:8000/api/patients/1/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 📦 Git & GitHub Commands

### Before Deployment

```bash
# Check git status
git status

# Stage all changes
git add .

# Commit changes
git commit -m "Ready for production deployment"

# View commit log
git log --oneline -5

# Push to GitHub
git push origin main

# Verify push succeeded
git log --oneline -1 origin/main
```

### After Deployment (Update)

```bash
# Make changes locally
# ... edit files ...

# Stage and commit
git add .
git commit -m "Fix: description of changes"

# Push to trigger auto-deploy
git push origin main

# Check if services are auto-deploying
# (Check Render and Vercel dashboards)
```

### Troubleshooting Git Issues

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Check remote URLs
git remote -v

# Add/update remote
git remote set-url origin https://github.com/susancodex/Hospital_Management_System.git

# Sync local with remote
git fetch origin
git reset --hard origin/main
```

---

## ☁️ Render Commands (Using Render CLI)

### Installation

```bash
# Install Render CLI (macOS)
brew tap render-oss/render
brew install render

# OR install globally with npm
npm install -g @render-org/render-cli

# Verify installation
render --version
```

### View Logs

```bash
# View backend service logs (live)
render logs --service hospital-management-backend --tail

# View specific number of lines
render logs --service hospital-management-backend --lines 50

# View logs from last hour
render logs --service hospital-management-backend --since 1h

# Search logs for keyword
render logs --service hospital-management-backend | grep "ERROR"
```

### Manage Services

```bash
# List all services
render services

# View service details
render services --service hospital-management-backend

# Manually trigger redeploy
render deploy --service hospital-management-backend

# Get service URL
render services --service hospital-management-backend | grep URL
```

### Environment Variables (CLI)

```bash
# View environment variables
render env --service hospital-management-backend

# Set environment variable
render env --service hospital-management-backend \
  --set SECRET_KEY=your-new-secret-key

# View specific variable
render env --service hospital-management-backend | grep DEBUG
```

---

## 🌐 Testing Deployed Services

### Backend (Render)

```bash
# Replace "hospital-management-backend" with your actual service name

# Health check
curl https://hospital-management-backend.onrender.com/api/

# With response headers
curl -i https://hospital-management-backend.onrender.com/api/

# Check CORS headers
curl -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://hospital-management-backend.onrender.com/api/ \
  -v

# Test static files
curl https://hospital-management-backend.onrender.com/static/admin/css/base.css

# Test admin login page
curl https://hospital-management-backend.onrender.com/admin/

# Login to production (test auth)
curl -X POST https://hospital-management-backend.onrender.com/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your-password"}'
```

### Frontend (Vercel)

```bash
# Replace "your-app" with your actual Vercel deployment name

# Check if frontend loads
curl https://your-app.vercel.app

# Follow redirects
curl -L https://your-app.vercel.app

# Check response headers
curl -i https://your-app.vercel.app

# Check if dist files are accessible
curl https://your-app.vercel.app/index.html

# Monitor for 200 OK
curl -w "\n%{http_code}\n" https://your-app.vercel.app
```

---

## 🔍 Debugging Commands

### Database Debugging

```bash
# Connect to Render PostgreSQL (if you have DATABASE_URL)
# Note: Replace connection string with your actual DATABASE_URL

# Via psql
psql postgresql://user:password@host:5432/database

# Check database exists
psql postgresql://... -c "\l"

# Check tables in database
psql postgresql://... -c "\dt"

# Run SQL query
psql postgresql://... -c "SELECT * FROM core_user LIMIT 5;"

# Check migrations applied
psql postgresql://... -c "SELECT * FROM django_migrations;"
```

### Network Debugging

```bash
# Check if domain resolves
nslookup hospital-management-backend.onrender.com
nslookup your-app.vercel.app

# Check routing
traceroute hospital-management-backend.onrender.com

# Check open ports
netstat -tuln | grep 8000  # backend
netstat -tuln | grep 5000  # frontend dev

# Test connectivity
telnet hospital-management-backend.onrender.com 443
```

### Python Debugging

```bash
# Check Python version
python --version

# Check installed packages
pip list | grep -i django
pip list | grep -i gunicorn

# Check virtual environment
which python  # Should show path inside venv

# Debug Django settings
python -c "from django.conf import settings; print(settings.DEBUG)"

# Run management command
python manage.py shell

# Inside shell:
>>> from django.conf import settings
>>> print(settings.ALLOWED_HOSTS)
>>> print(settings.DATABASES)
>>> print(settings.DEBUG)
>>> exit()
```

### Frontend Debugging

```bash
# Check Node version
node --version

# Check npm version
npm --version

# List installed packages
npm list

# Check specific package
npm list vite
npm list react

# Build with verbose output
npm run build -- --logLevel verbose

# Check build output
ls -lah frontend/dist/

# Count files in dist
find frontend/dist -type f | wc -l
```

---

## 🚀 Deployment Automation Scripts

### Quick Deploy Script (Bash)

```bash
#!/bin/bash
# save as: deploy.sh
# usage: ./deploy.sh

echo "🔄 Checking git status..."
git status

echo "📦 Staging changes..."
git add .

echo "💬 Committing..."
git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Deployment triggered!"
echo "Check Render: https://dashboard.render.com"
echo "Check Vercel: https://vercel.com/dashboard"
```

**Usage**:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Build Size Check Script

```bash
#!/bin/bash
# save as: check-build.sh
# usage: ./check-build.sh

echo "📊 Frontend Build Analysis"
echo "============================"

if [ -d "frontend/dist" ]; then
  echo "✅ dist/ folder exists"
  echo "Folder size: $(du -sh frontend/dist | cut -f1)"
  
  echo ""
  echo "File breakdown:"
  find frontend/dist -type f | wc -l | xargs echo "Total files:"
  
  echo ""
  find frontend/dist -name "*.js" | xargs du -ch | tail -1 | xargs echo "Total JS:"
  find frontend/dist -name "*.css" | xargs du -ch | tail -1 | xargs echo "Total CSS:"
  find frontend/dist -name "*.html" | xargs du -ch | tail -1 | xargs echo "Total HTML:"
  
  echo ""
  echo "Largest files:"
  find frontend/dist -type f -exec du -h {} + | sort -rh | head -5
else
  echo "❌ dist/ folder not found. Run: npm run build"
fi
```

**Usage**:
```bash
chmod +x check-build.sh
./check-build.sh
```

---

## ✨ Environment Variable Testing

### Print All Backend Env Vars

```bash
# Create a test script
cat > test_env.py << 'EOF'
import os
from pathlib import Path

# Load from .env if exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

print("Backend Environment Variables:")
print("=" * 40)

vars_to_check = [
    'SECRET_KEY',
    'DEBUG',
    'ALLOWED_HOSTS',
    'DATABASE_URL',
    'CORS_ALLOWED_ORIGINS',
    'CORS_ALLOWED_ORIGIN_REGEXES',
    'CSRF_TRUSTED_ORIGINS',
    'PYTHON_VERSION',
]

for var in vars_to_check:
    value = os.environ.get(var, '[NOT SET]')
    # Hide sensitive values
    if var in ['SECRET_KEY', 'DATABASE_URL']:
        if value != '[NOT SET]':
            value = value[:10] + '...' + value[-10:]
    print(f"{var}: {value}")
EOF

python test_env.py
```

### Check Frontend Env Vars

```bash
# In frontend .env.local or .env.production
cat frontend/.env.local
cat frontend/.env.production

# Check what Vite sees
grep "VITE_" frontend/.env.local
```

---

## 🆘 Emergency Commands

### Kill Port Process (if stuck)

```bash
# macOS/Linux - Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 5000 (frontend)
lsof -ti:5000 | xargs kill -9

# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F
```

### Force Reset Local Database

```bash
# WARNING: This deletes all local data!

cd backend

# Delete migrations (except __init__.py)
find core/migrations -name "*.py" ! -name "__init__.py" -delete

# Delete database file
rm db.sqlite3

# Re-create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create new superuser
python manage.py createsuperuser
```

### Full Clean Rebuild Frontend

```bash
cd frontend

# Remove node_modules and lock file
rm -rf node_modules
rm package-lock.json  # or yarn.lock

# Remove dist
rm -rf dist

# Fresh install and build
npm install
npm run build

# Check build
ls -lah dist/
```

### Clear Render Cache

```bash
# Via Render dashboard (no CLI equivalent)
# Settings → Clear build cache → Confirm
# Then manually redeploy

# Or via git (force new build)
git commit --allow-empty -m "Force rebuild"
git push origin main
```

---

## 📊 Performance Testing

### Test API Response Time

```bash
# Backend API response time
time curl https://hospital-management-backend.onrender.com/api/

# Frontend page load time
time curl -L https://your-app.vercel.app > /dev/null

# With details
curl -w "
  Time to first byte: %{time_starttransfer}s
  Time to connect: %{time_connect}s
  Total time: %{time_total}s
  Response code: %{http_code}
\n" -o /dev/null -s https://hospital-management-backend.onrender.com/api/
```

### Load Testing (Basic)

```bash
# Install Apache Bench (macOS)
brew install httpd

# Test API endpoint with 100 requests, 10 concurrent
ab -n 100 -c 10 https://hospital-management-backend.onrender.com/api/

# Test frontend with 50 requests
ab -n 50 -c 5 https://your-app.vercel.app/

# Full report with timing details
ab -n 100 -c 10 -r https://hospital-management-backend.onrender.com/api/
```

---

## 📝 Useful One-Liners

```bash
# View last 10 commits
git log --oneline -10

# See who changed what
git log -p --follow -- backend/hospital_system/settings.py

# Find all TODO comments
grep -r "TODO" backend/ frontend/

# Count lines of code
wc -l backend/**/*.py frontend/src/**/*.jsx

# Find all Python syntax errors
python -m py_compile backend/**/*.py

# Find all unused imports (requires pylint)
pylint --disable=all --enable=W0611 backend/

# Check file permissions
ls -la backend/manage.py

# Show git diff since last deploy
git diff origin/main HEAD
```

---

## 🎯 Complete Deploy Sequence

```bash
# Step 1: Local testing
cd backend && python manage.py test  # if tests exist
cd ../frontend && npm run build

# Step 2: Prepare deployment
git add .
git commit -m "v1.0: Production ready"

# Step 3: Deploy backend
# (via Render dashboard or CLI)

# Step 4: Deploy frontend
# (via Vercel dashboard)

# Step 5: Verify
curl https://hospital-management-backend.onrender.com/api/
curl https://your-app.vercel.app/

echo "✅ Deployment complete!"
```

---

**Last Updated**: 2025-04-24
**Version**: 1.0
