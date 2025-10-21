# GitHub Pages + Railway Deployment Guide

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

# CORS Configuration for GitHub Pages
SANCTUM_STATEFUL_DOMAINS=protacium05.github.io
SESSION_DOMAIN=.github.io
```

### **Step 4: Enable GitHub Pages**

1. **Go to your GitHub repository**
2. **Click "Settings" → "Pages"**
3. **Source:** "GitHub Actions"
4. **Save settings**

### **Step 5: Configure GitHub Secrets**

**In GitHub repository → Settings → Secrets and variables → Actions:**

```bash
VITE_API_URL=https://your-railway-backend-url.up.railway.app
VITE_API_BASE_URL=https://your-railway-backend-url.up.railway.app/api
```

### **Step 6: Deploy Frontend**

1. **Push your code to GitHub**
2. **GitHub Actions will automatically build and deploy**
3. **Your site will be available at:** `https://protacium05.github.io/EverBright-Optical-Clinic-System`

### **Step 7: Test Integration**

1. **Visit your GitHub Pages URL**
2. **Check browser console for API calls**
3. **Test login functionality**
4. **Verify CORS is working**

## 🎯 GitHub Pages Advantages

- ✅ **Completely FREE** - No limits
- ✅ **Unlimited builds** - No monthly restrictions
- ✅ **Unlimited bandwidth** - No traffic limits
- ✅ **Custom domains** - Use your own domain
- ✅ **HTTPS included** - Automatic SSL
- ✅ **Fast CDN** - Global content delivery
- ✅ **Easy setup** - Just enable Pages
- ✅ **Automatic deployments** - On every push

## 🔧 Custom Domain Setup (Optional)

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)
2. **Add CNAME record** pointing to `protacium05.github.io`
3. **In GitHub Pages settings, add your custom domain**
4. **Enable "Enforce HTTPS"**

## 🔧 Troubleshooting

### **Common Issues:**

1. **Build Failures:**
   - Check GitHub Actions logs
   - Verify Node.js version
   - Check for dependency issues

2. **Environment Variables:**
   - Ensure secrets are set in GitHub
   - Check for typos in URLs
   - Verify secret names match workflow

3. **CORS Issues:**
   - Update Railway CORS for GitHub Pages domain
   - Check SANCTUM_STATEFUL_DOMAINS
   - Verify APP_URL matches Railway URL

### **Useful Commands:**

```bash
# Test locally
cd frontend--
npm run build
npm run preview

# Check build output
ls -la frontend--/dist
```

## 🎯 Final URLs

- **Frontend:** `https://protacium05.github.io/EverBright-Optical-Clinic-System`
- **Backend:** `https://your-railway-backend.up.railway.app`
- **API:** `https://your-railway-backend.up.railway.app/api`

## ✅ Success Indicators

- ✅ Railway shows "PHP" instead of "Node"
- ✅ Backend deploys without errors
- ✅ GitHub Actions build succeeds
- ✅ GitHub Pages site is accessible
- ✅ API calls work from frontend
- ✅ No CORS errors in browser console
- ✅ Login functionality works
