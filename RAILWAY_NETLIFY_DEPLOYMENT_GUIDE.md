# Railway + Netlify Deployment Guide

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

### **Step 3: Configure Environment Variables**

**In Railway dashboard → Your Backend Service → Variables tab:**

```bash
# Laravel Configuration
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
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

# CORS Configuration for Netlify
SANCTUM_STATEFUL_DOMAINS=everbright-optical-system.netlify.app
SESSION_DOMAIN=.netlify.app
```

### **Step 4: Generate APP_KEY**

**Run locally:**
```bash
cd backend
php artisan key:generate --show
```

**Copy the generated key and paste it as APP_KEY in Railway**

### **Step 5: Deploy Frontend to Netlify**

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign in with GitHub**
3. **Click "New site from Git"**
4. **Select your repository**
5. **Set Build Settings:**
   - **Base directory:** `frontend--`
   - **Build command:** `npm ci && npm run build`
   - **Publish directory:** `frontend--/dist`

### **Step 6: Configure Netlify Environment Variables**

**In Netlify dashboard → Site settings → Environment variables:**

```bash
VITE_API_URL=https://your-railway-backend-url.up.railway.app
VITE_API_BASE_URL=https://your-railway-backend-url.up.railway.app/api
VITE_APP_NAME=Everbright Optical System
VITE_APP_ENV=production
```

### **Step 7: Update CORS Configuration**

**After getting your Railway backend URL, update:**
1. **Railway environment variables** with the correct APP_URL
2. **Netlify environment variables** with the correct API URLs
3. **Redeploy both services**

### **Step 8: Test Integration**

1. **Visit your Netlify frontend URL**
2. **Check browser console for API calls**
3. **Test login functionality**
4. **Verify CORS is working**

## 🔧 Troubleshooting

### **Common Issues:**

1. **CORS Errors:**
   - Check Railway CORS configuration
   - Verify Netlify domain is in allowed origins
   - Ensure APP_URL matches Railway URL

2. **Database Connection:**
   - Verify PostgreSQL credentials in Railway
   - Check database is running
   - Run migrations: `php artisan migrate`

3. **Environment Variables:**
   - Ensure all variables are set in both platforms
   - Check for typos in URLs
   - Verify APP_KEY is generated

### **Useful Commands:**

```bash
# Generate APP_KEY
php artisan key:generate --show

# Run migrations
php artisan migrate

# Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## 🎯 Final URLs

- **Frontend:** `https://your-netlify-site.netlify.app`
- **Backend:** `https://your-railway-backend.up.railway.app`
- **API:** `https://your-railway-backend.up.railway.app/api`

## ✅ Success Indicators

- ✅ Railway shows "PHP" instead of "Node"
- ✅ Backend deploys without errors
- ✅ Frontend builds successfully
- ✅ API calls work from frontend
- ✅ No CORS errors in browser console
- ✅ Login functionality works
