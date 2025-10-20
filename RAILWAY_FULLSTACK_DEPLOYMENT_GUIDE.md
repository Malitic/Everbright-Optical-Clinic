# 🚀 Railway Fullstack Deployment Guide - Everbright Optical System

## 📋 Overview
This guide will help you deploy both the Laravel backend and React frontend to Railway as separate services.

## 🏗️ Architecture
- **Backend Service**: Laravel API (PHP 8.2+)
- **Frontend Service**: React + Vite (Node.js)
- **Database**: SQLite (included with backend)

## 🎯 Deployment Steps

### Step 1: Prepare Backend Deployment

#### 1.1 Create Backend Service on Railway
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. **Important**: Set the root directory to `backend`
6. Name it: `everbright-optical-backend`

#### 1.2 Backend Environment Variables
In Railway dashboard, go to Variables tab and add:

```env
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:your-generated-key-here
APP_URL=https://everbright-optical-backend.railway.app

DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

LOG_CHANNEL=stack
LOG_LEVEL=error
```

#### 1.3 Backend Configuration Files
The following files are already configured:
- ✅ `backend/railway.json` - Railway deployment config
- ✅ `backend/Procfile` - Process configuration
- ✅ `backend/composer.json` - PHP dependencies

### Step 2: Prepare Frontend Deployment

#### 2.1 Create Frontend Service on Railway
1. Go to Railway Dashboard
2. Click "New Project" 
3. Select "Deploy from GitHub repo"
4. Choose the same repository
5. **Important**: Set the root directory to `.` (root)
6. Name it: `everbright-optical-frontend`

#### 2.2 Frontend Environment Variables
In Railway dashboard, go to Variables tab and add:

```env
VITE_API_URL=https://everbright-optical-backend.railway.app/api
NODE_ENV=production
```

#### 2.3 Frontend Configuration Files
The following files are already configured:
- ✅ `railway.json` - Railway deployment config (root level)
- ✅ `frontend--/package.json` - Node.js dependencies

### Step 3: Deploy Backend First

#### 3.1 Deploy Backend
1. Go to your backend service in Railway
2. Click "Deploy" or wait for auto-deployment
3. Monitor the build logs
4. Wait for deployment to complete

#### 3.2 Test Backend
Once deployed, test these endpoints:

**Health Check:**
```
GET https://everbright-optical-backend.railway.app/api/health
```

**Main API:**
```
GET https://everbright-optical-backend.railway.app/api/
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Everbright Optical System API is running",
  "version": "1.0.0"
}
```

### Step 4: Deploy Frontend

#### 4.1 Update Frontend API URL
1. Go to your frontend service in Railway
2. Update the `VITE_API_URL` variable to match your backend URL
3. Deploy the frontend

#### 4.2 Test Frontend
Once deployed, visit:
```
https://everbright-optical-frontend.railway.app
```

### Step 5: Configure Custom Domains (Optional)

#### 5.1 Backend Domain
1. Go to backend service settings
2. Add custom domain: `api.everbright-optical.com`
3. Update DNS records

#### 5.2 Frontend Domain  
1. Go to frontend service settings
2. Add custom domain: `everbright-optical.com`
3. Update DNS records

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
**Problem**: Build fails
**Solution**: Check PHP version compatibility (requires PHP 8.2+)

**Problem**: Database connection fails
**Solution**: Ensure SQLite file exists and is writable

**Problem**: Health check fails
**Solution**: Verify `/api/health` route exists

#### Frontend Issues
**Problem**: Build fails
**Solution**: Check Node.js version (requires Node 18+)

**Problem**: API calls fail
**Solution**: Verify `VITE_API_URL` is correct

**Problem**: CORS errors
**Solution**: Check Laravel CORS configuration

### Debugging Steps

1. **Check Railway Logs**
   - Go to service dashboard
   - Click "Deployments" tab
   - View build and runtime logs

2. **Test API Endpoints**
   ```bash
   curl https://everbright-optical-backend.railway.app/api/health
   ```

3. **Check Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names

## 📊 Monitoring

### Health Checks
- **Backend**: `GET /api/health`
- **Frontend**: `GET /` (should return HTML)

### Logs
- Monitor Railway logs for errors
- Set up alerts for failed deployments

## 🔄 Updates and Maintenance

### Updating Backend
1. Push changes to GitHub
2. Railway auto-deploys
3. Monitor deployment status

### Updating Frontend
1. Push changes to GitHub
2. Railway auto-deploys
3. Test frontend functionality

### Database Backups
- SQLite database is included in deployment
- Consider setting up automated backups
- Export data regularly

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ API calls work from frontend
- ✅ No errors in Railway logs
- ✅ Both services show "Deployed" status

## 📞 Support

If you encounter issues:
1. Check Railway documentation
2. Review build/runtime logs
3. Test endpoints individually
4. Verify environment variables

---

**Next Steps**: Follow this guide step by step to deploy your fullstack application to Railway!
