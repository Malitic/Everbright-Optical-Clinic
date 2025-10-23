# 🚀 Quick Start: Deploy to Railway

## Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub account
- Node.js installed
- PHP 8.2+ installed

## Option 1: One-Click Deployment (Recommended)

### Windows:
```bash
# Run the complete deployment script
deploy-complete.bat
```

### Linux/Mac:
```bash
# Make script executable and run
chmod +x deploy-complete.sh
./deploy-complete.sh
```

## Option 2: Manual Step-by-Step

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Deploy Backend
```bash
cd backend
railway init
railway up
```

### 4. Deploy Frontend
```bash
cd ../frontend--
railway init
railway up
```

### 5. Set Environment Variables
In Railway dashboard, set these variables:

**Backend Service:**
```
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=your-generated-key
DB_CONNECTION=mysql
DB_HOST=mysql.railway.internal
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=your-mysql-password
REDIS_HOST=redis.railway.internal
REDIS_PASSWORD=your-redis-password
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

**Frontend Service:**
```
VITE_API_URL=https://your-backend.railway.app/api
```

### 6. Add Database Services
1. In Railway dashboard → "New Service" → "Database" → "MySQL"
2. In Railway dashboard → "New Service" → "Database" → "Redis"

### 7. Run Migrations
```bash
cd backend
railway run php artisan migrate --force
```

## Option 3: GitHub Integration

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Connect to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-deploy

## Environment Variables Reference

### Backend (.env)
```env
APP_NAME="Everbright Optical System"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://your-backend.railway.app

DB_CONNECTION=mysql
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=your-mysql-password

REDIS_HOST=redis.railway.internal
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.railway.app/api
```

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node.js version (18+)
   - Clear npm cache: `npm cache clean --force`
   - Check package.json dependencies

2. **Database Connection**
   - Verify MySQL service is running
   - Check environment variables
   - Test connection manually

3. **CORS Issues**
   - Update CORS_ALLOWED_ORIGINS
   - Check frontend URL matches exactly
   - Verify CORS middleware is active

4. **Performance Issues**
   - Enable Redis caching
   - Optimize database queries
   - Use CDN for static assets

## Cost Estimation

- **Free Tier**: $5 credit monthly (500 hours)
- **Pro Plan**: $5/month per service
- **Estimated Cost**: ~$5/month for basic setup

## Support

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Laravel Deployment Guide](https://laravel.com/docs/deployment)

---

**Ready to deploy?** Run `deploy-complete.bat` (Windows) or `./deploy-complete.sh` (Linux/Mac)!
