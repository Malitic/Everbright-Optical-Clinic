# Vercel + Railway Deployment Guide

## 🚀 Complete Setup Instructions

### **Step 1: Deploy Backend to Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository: `protacium05/EverBright-Optical-Clinic-System`**
5. **Set Root Directory:** `backend`
6. **Railway will automatically detect PHP and deploy**

### **Step 2: Add PostgreSQL Database**

1. **In Railway dashboard, click "New" → "Database" → "PostgreSQL"**
2. **Railway will create a PostgreSQL database**
3. **Copy the connection details**

### **Step 3: Configure Railway Environment Variables**

**In Railway dashboard → Your Backend Service → Variables tab:**

```bash
# Laravel Configuration
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:a4l7XGiTV4ggw1EUKHZGLd22QwavJmOcVnNT38T6GYQ=
APP_URL=https://your-railway-backend-url.up.railway.app

# Database Configuration (from Railway PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_DATABASE=railway
DB_USERNAME=postgres
DB_PASSWORD=YOUR_RAILWAY_POSTGRES_PASSWORD

# Cache and Session
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# CORS Configuration for Vercel
SANCTUM_STATEFUL_DOMAINS=your-vercel-app.vercel.app
SESSION_DOMAIN=.vercel.app
```

### **Step 4: Deploy Frontend to Vercel**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select your repository**
5. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend--`
   - **Build Command:** `npm ci && npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`

### **Step 5: Configure Vercel Environment Variables**

**In Vercel dashboard → Project Settings → Environment Variables:**

```bash
VITE_API_URL=https://your-railway-backend-url.up.railway.app
VITE_API_BASE_URL=https://your-railway-backend-url.up.railway.app/api
VITE_APP_NAME=Everbright Optical System
VITE_APP_ENV=production
```

### **Step 6: Update CORS Configuration**

**Update Railway CORS to allow Vercel domains:**

```bash
# In Railway environment variables, update:
SANCTUM_STATEFUL_DOMAINS=your-vercel-app.vercel.app
SESSION_DOMAIN=.vercel.app
```

### **Step 7: Test Integration**

1. **Visit your Vercel frontend URL**
2. **Check browser console for API calls**
3. **Test login functionality**
4. **Verify CORS is working**

## 🔧 Vercel Configuration Files

### **vercel.json (Optional)**
```json
{
  "buildCommand": "cd frontend-- && npm ci && npm run build",
  "outputDirectory": "frontend--/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🎯 Vercel Advantages Over Netlify

- ✅ **Higher build limits** (100 builds/month vs 300 minutes)
- ✅ **Better performance** (Edge Network)
- ✅ **Faster deployments** (usually < 30 seconds)
- ✅ **Better React/Vite support**
- ✅ **Automatic HTTPS**
- ✅ **Preview deployments** for every PR
- ✅ **Better analytics**

## 🔧 Troubleshooting

### **Common Issues:**

1. **Build Failures:**
   - Check Node.js version (Vercel auto-detects)
   - Verify build command
   - Check for dependency issues

2. **Environment Variables:**
   - Ensure all VITE_ variables are set
   - Check for typos in URLs
   - Redeploy after setting variables

3. **CORS Issues:**
   - Update Railway CORS for Vercel domain
   - Check SANCTUM_STATEFUL_DOMAINS
   - Verify APP_URL matches Railway URL

### **Useful Commands:**

```bash
# Test locally with Vercel
npx vercel dev

# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod
```

## 🎯 Final URLs

- **Frontend:** `https://your-vercel-app.vercel.app`
- **Backend:** `https://your-railway-backend.up.railway.app`
- **API:** `https://your-railway-backend.up.railway.app/api`

## ✅ Success Indicators

- ✅ Railway shows "PHP" instead of "Node"
- ✅ Backend deploys without errors
- ✅ Vercel frontend builds successfully
- ✅ API calls work from frontend
- ✅ No CORS errors in browser console
- ✅ Login functionality works
- ✅ Vercel shows "Ready" status
