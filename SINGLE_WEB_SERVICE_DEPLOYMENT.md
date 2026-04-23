# 🚀 Single Web Service Deployment Guide (Render Free Tier)

This project is configured to deploy as **ONE SINGLE WEB SERVICE** on Render free tier.

## ✅ Final Configuration
`render.yaml` builds both frontend and backend in a single service:
- ✅ Builds backend dependencies
- ✅ Runs database migrations
- ✅ Builds React frontend
- ✅ Copies frontend assets to Django static folder
- ✅ Serves everything via Django + Gunicorn + WhiteNoise

## 📋 Step by Step Deployment

1. **Go to Render Dashboard**
   - https://render.com
   - Login with GitHub

2. **Create New Web Service**
   - Click **New +** → **Web Service**
   - Select your repository: `susancodex/Hospital_Management_System`
   - Click **Connect**

3. **Configure Service**
   ```
   Name: hospital-management-system
   Region: select any region
   Branch: main
   Runtime: Python
   Build Command: (auto-detected from render.yaml)
   Start Command: (auto-detected from render.yaml)
   Plan: Free
   ```

4. **Click Deploy**
   That's it! Render will automatically:
   - Install all backend dependencies
   - Install all frontend dependencies
   - Build React frontend
   - Run Django migrations
   - Collect static files
   - Start the server

## 🔗 After Deployment

You will get ONE single URL like:
`https://hospital-management-system-xxxx.onrender.com`

✅ Frontend runs at root URL `/`  
✅ Backend API runs at `/api/`  
✅ Django admin at `/admin/`

## ⚠️ Important Notes for Free Tier
- Service sleeps after 15 minutes of inactivity
- First load after sleep takes ~30 seconds
- 750 hours / month free quota
- No credit card required

## 🔍 Troubleshooting

**Build fails with Node not found:**
Add this environment variable:
```
NODE_VERSION = 20
```

**Static files 404:**
Verify build command completed successfully and frontend assets were copied correctly.

**500 Internal Server Error:**
Temporarily set `DEBUG=true` environment variable to see full error trace.

## ✅ Verification Checklist
- [ ] Service deployed successfully
- [ ] Frontend loads correctly on root URL
- [ ] You can register/login
- [ ] API endpoints work
- [ ] Admin panel loads
