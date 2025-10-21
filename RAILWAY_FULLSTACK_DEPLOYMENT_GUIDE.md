# Railway Full-Stack Deployment Guide

## 🚀 Deploy Both Frontend and Backend to Railway

### **Step 1: Deploy to Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository: `protacium05/EverBright-Optical-Clinic-System`**
5. **Railway will automatically detect the configuration**

### **Step 2: Add PostgreSQL Database**

1. **In Railway dashboard, click "New" → "Database" → "PostgreSQL"**
2. **Railway will create a PostgreSQL database**
3. **Copy the connection details**

### **Step 3: Configure Environment Variables**

**In Railway dashboard → Your Service → Variables tab:**

```bash
# Laravel Configuration
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:a4l7XGiTV4ggw1EUKHZGLd22QwavJmOcVnNT38T6GYQ=
APP_URL=https://your-railway-app.up.railway.app

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

# Frontend Configuration
VITE_API_URL=https://your-railway-app.up.railway.app
VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api
VITE_APP_NAME=Everbright Optical System
VITE_APP_ENV=production
```

### **Step 4: How It Works**

**The deployment process:**

1. **Railway detects PHP** (from backend directory)
2. **Installs Node.js** (for frontend build)
3. **Runs startup script** (`start.sh`):
   - Builds frontend with `npm run build`
   - Generates Laravel APP_KEY
   - Runs database migrations
   - Starts Laravel server
4. **Laravel serves both:**
   - API routes: `/api/*`
   - Frontend: All other routes serve React app

### **Step 5: Access Your Application**

**After deployment:**
- **Frontend:** `https://your-railway-app.up.railway.app`
- **API:** `https://your-railway-app.up.railway.app/api`
- **Health Check:** `https://your-railway-app.up.railway.app/api/health`

### **Step 6: Test Everything**

1. **Visit your Railway URL**
2. **You should see your React frontend**
3. **Test login functionality**
4. **Check browser console for API calls**

## 🎯 Advantages of Railway Full-Stack

- ✅ **Single deployment** - Everything in one place
- ✅ **No CORS issues** - Same domain for frontend and backend
- ✅ **Simpler configuration** - No separate hosting needed
- ✅ **Cost effective** - One service instead of two
- ✅ **Easy management** - Single dashboard
- ✅ **Automatic HTTPS** - SSL included
- ✅ **Custom domains** - Easy to add

## 🔧 Troubleshooting

### **Common Issues:**

1. **Build Failures:**
   - Check Railway logs
   - Verify Node.js dependencies
   - Check for missing files

2. **Database Connection:**
   - Verify PostgreSQL service is running
   - Check environment variables
   - Ensure migrations run

3. **Frontend Not Loading:**
   - Check if `frontend--/dist` directory exists
   - Verify build process completed
   - Check Laravel web routes

### **Useful Commands:**

```bash
# Test locally
cd frontend--
npm run build
cd ../backend
php artisan serve

# Check build output
ls -la frontend--/dist
```

## ✅ Success Indicators

- ✅ Railway shows "PHP" instead of "Node"
- ✅ Build process completes successfully
- ✅ Database migrations run
- ✅ Frontend loads at Railway URL
- ✅ API endpoints work
- ✅ Login functionality works
- ✅ No CORS errors

## 🎯 Final Result

**One URL for everything:**
- **Frontend:** `https://your-app.up.railway.app`
- **API:** `https://your-app.up.railway.app/api`
- **Admin:** `https://your-app.up.railway.app/admin`
- **All features work seamlessly!**