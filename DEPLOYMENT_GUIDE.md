# 🚀 Everbright Optical System - Free Online Deployment Guide

This guide will help you deploy your Everbright Optical System online for free so your IT expert can evaluate it.

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Railway Account** (free tier available)
3. **Vercel Account** (free tier available)

## 🎯 Deployment Strategy

- **Backend (Laravel)**: Deploy to Railway
- **Frontend (React)**: Deploy to Vercel
- **Database**: SQLite (included with Railway)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Deploy Backend to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Configure the project**:
   - **Root Directory**: `backend`
   - **Build Command**: `composer install --no-dev --optimize-autoloader`
   - **Start Command**: `php artisan serve --host=0.0.0.0 --port=$PORT`

7. **Set Environment Variables** in Railway dashboard:
   ```
   APP_NAME=Everbright Optical System
   APP_ENV=production
   APP_DEBUG=false
   DB_CONNECTION=sqlite
   ```

8. **Deploy** and wait for it to complete
9. **Copy the Railway URL** (e.g., `https://your-app-name.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure the project**:
   - **Root Directory**: `frontend--`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

7. **Deploy** and wait for it to complete
8. **Copy the Vercel URL** (e.g., `https://your-app-name.vercel.app`)

### Step 4: Update Backend CORS Settings

1. **In Railway dashboard**, add environment variable:
   ```
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

2. **Update your Laravel CORS config** (if needed):
   ```php
   // config/cors.php
   'allowed_origins' => [
       'https://your-frontend-url.vercel.app',
       'http://localhost:5173' // for development
   ],
   ```

### Step 5: Database Setup

1. **In Railway**, your SQLite database will be automatically created
2. **Run migrations** by adding this to your Railway start command:
   ```bash
   php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
   ```

3. **Seed the database** (optional):
   ```bash
   php artisan db:seed --force
   ```

## 🔧 Configuration Files Created

I've created the following configuration files for you:

- `railway.json` - Railway deployment configuration
- `Procfile` - Process file for Railway
- `backend/railway.json` - Backend-specific Railway config
- `backend/Procfile` - Backend process file
- `frontend--/vercel.json` - Vercel deployment configuration
- `backend/env.production` - Production environment template
- `frontend--/env.production` - Frontend production environment

## 🌐 Access Your Deployed Application

After deployment, you'll have:

- **Frontend URL**: `https://your-app-name.vercel.app`
- **Backend API URL**: `https://your-backend-name.railway.app`

## 🧪 Testing Your Deployment

1. **Visit your frontend URL**
2. **Test the login functionality**
3. **Check if API calls are working**
4. **Verify all features are accessible**

## 📱 Share with Your IT Expert

Provide your IT expert with:
- **Frontend URL**: For user interface testing
- **Backend API URL**: For API testing
- **Test credentials** (if you have any seeded users)

## 🔄 Updates and Maintenance

- **Code changes**: Push to GitHub, and both Railway and Vercel will auto-deploy
- **Database changes**: Use Railway's database tools
- **Environment variables**: Update in respective dashboards

## 🆘 Troubleshooting

### Common Issues:

1. **CORS errors**: Update CORS settings in Laravel
2. **Database issues**: Check SQLite file permissions
3. **Build failures**: Check build logs in Railway/Vercel dashboards
4. **Environment variables**: Ensure all required variables are set

### Support Resources:

- **Railway Documentation**: https://docs.railway.app
- **Vercel Documentation**: https://vercel.com/docs
- **Laravel Deployment**: https://laravel.com/docs/deployment

## 🎉 Success!

Once deployed, your Everbright Optical System will be accessible online for your IT expert to evaluate. The system will be available 24/7 and can handle multiple concurrent users.

---

**Note**: Both Railway and Vercel offer generous free tiers that should be sufficient for evaluation purposes. If you need more resources later, you can upgrade to paid plans.
