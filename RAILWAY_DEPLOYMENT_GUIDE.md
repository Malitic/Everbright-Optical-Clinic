# 🚀 Railway Deployment Guide for Everbright Optical System

## Overview
This guide will help you deploy your Laravel + React + MySQL system to Railway.

## Prerequisites
- Railway account (free at [railway.app](https://railway.app))
- GitHub account (for code repository)
- Node.js installed locally
- PHP 8.2+ installed locally

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Railway deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/everbright-optical.git
git push -u origin main
```

### 1.2 Verify Project Structure
Your project should have this structure:
```
everbright-optical/
├── backend/                 # Laravel backend
├── frontend--/             # React frontend
├── railway.json            # Railway configuration
├── Dockerfile              # Docker configuration
├── docker/                 # Docker configs
├── deploy-railway.sh       # Deployment script
├── deploy-railway.bat      # Windows deployment script
└── railway.env.template    # Environment template
```

## Step 2: Set Up Railway Project

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repositories

### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `everbright-optical` repository
4. Railway will auto-detect Laravel and start building

### 2.3 Add MySQL Database
1. In your Railway project dashboard
2. Click "New Service" → "Database" → "MySQL"
3. Railway will create a MySQL instance
4. Note the connection details (you'll need these)

### 2.4 Add Redis (Optional but Recommended)
1. Click "New Service" → "Database" → "Redis"
2. This will improve performance for caching and sessions

## Step 3: Configure Environment Variables

### 3.1 Set Required Variables
In Railway dashboard, go to your service → Variables tab:

```env
# Application
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-app.railway.app

# Database (from MySQL service)
DB_CONNECTION=mysql
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=your-mysql-password

# Redis (from Redis service)
REDIS_HOST=redis.railway.internal
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379

# Cache & Sessions
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# CORS (update with your frontend URL)
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.netlify.app
```

### 3.2 Generate Application Key
```bash
# Run locally in backend directory
cd backend
php artisan key:generate --show
```
Copy the generated key and set it as `APP_KEY` in Railway variables.

## Step 4: Deploy Backend

### 4.1 Automatic Deployment
Railway will automatically deploy when you push to GitHub.

### 4.2 Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

## Step 5: Deploy Frontend

### Option A: Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

### Option B: Netlify
1. Go to [netlify.com](https://netlify.com)
2. Import your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

### Option C: Railway Frontend Service
1. Create new service in Railway
2. Set build command: `npm run build`
3. Set start command: `npm run preview`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

## Step 6: Database Migration

### 6.1 Run Migrations
```bash
# Connect to Railway service
railway connect

# Run migrations
php artisan migrate --force

# Seed database (optional)
php artisan db:seed --force
```

### 6.2 Import Existing Data
If you have existing data:
```bash
# Export from local MySQL
mysqldump -u root -p everbright_optical > backup.sql

# Import to Railway MySQL
mysql -h mysql.railway.internal -u root -p railway < backup.sql
```

## Step 7: Configure Custom Domains

### 7.1 Backend Domain
1. In Railway dashboard → Settings → Domains
2. Add custom domain: `api.everbrightoptical.com`
3. Update DNS records as instructed

### 7.2 Frontend Domain
1. In Vercel/Netlify → Settings → Domains
2. Add custom domain: `everbrightoptical.com`
3. Update DNS records

## Step 8: SSL Certificates
Railway automatically provides SSL certificates for all domains.

## Step 9: Monitoring & Logs

### 9.1 Railway Logs
- View logs in Railway dashboard
- Set up log monitoring
- Configure alerts

### 9.2 Application Monitoring
```bash
# Add monitoring to your Laravel app
composer require spatie/laravel-health
php artisan vendor:publish --provider="Spatie\Health\HealthServiceProvider"
```

## Step 10: Production Checklist

### Backend Checklist
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates active
- [ ] CORS configured for frontend
- [ ] Error logging configured
- [ ] Performance monitoring active

### Frontend Checklist
- [ ] API URL updated
- [ ] Build successful
- [ ] SSL certificates active
- [ ] Performance optimized
- [ ] Error handling configured

### Database Checklist
- [ ] Data imported successfully
- [ ] Indexes created
- [ ] Backups configured
- [ ] Performance monitoring active

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check logs in Railway dashboard
# Common fixes:
- Update Node.js version
- Clear npm cache
- Check package.json dependencies
```

#### 2. Database Connection Issues
```bash
# Verify environment variables
# Check MySQL service status
# Test connection manually
```

#### 3. CORS Issues
```bash
# Update CORS_ALLOWED_ORIGINS
# Check frontend URL matches exactly
# Verify CORS middleware is active
```

#### 4. Performance Issues
```bash
# Enable Redis caching
# Optimize database queries
# Use CDN for static assets
```

## Cost Estimation

### Railway Pricing
- **Free Tier**: $5 credit monthly (500 hours)
- **Pro Plan**: $5/month per service
- **Database**: Included in service cost

### Estimated Monthly Cost
- Backend service: $5
- MySQL database: Included
- Redis cache: Included
- **Total**: ~$5/month

## Support & Resources

### Railway Documentation
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

### Laravel Deployment
- [Laravel Deployment Guide](https://laravel.com/docs/deployment)
- [Laravel Railway Guide](https://laravel.com/docs/railway)

### React Deployment
- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com)

## Next Steps

1. **Set up CI/CD**: Configure GitHub Actions for automatic deployments
2. **Add monitoring**: Set up application performance monitoring
3. **Configure backups**: Set up automated database backups
4. **Add CDN**: Use CloudFlare or similar for static assets
5. **Set up staging**: Create staging environment for testing

---

## Quick Commands Reference

```bash
# Deploy to Railway
railway up

# Connect to service
railway connect

# View logs
railway logs

# Set variables
railway variables set KEY=value

# Run migrations
railway run php artisan migrate

# Access database
railway connect mysql
```

---

**Need help?** Check Railway's documentation or join their Discord community!
