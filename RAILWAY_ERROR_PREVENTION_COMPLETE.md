# 🚨 Railway Error Prevention - Complete Guide

## 🎯 **Current Issues & Immediate Fixes**

### **Issue 1: Conflicting Configuration Files**
**Problem**: You have both `Procfile` and `railway.json` which confuses Railway
**Solution**: Use separate services for backend and frontend

### **Issue 2: Missing Environment Variables**
**Problem**: Backend needs critical environment variables
**Solution**: Set all required variables in Railway dashboard

### **Issue 3: Database Path Issues**
**Problem**: SQLite database path may not be accessible
**Solution**: Use Railway's persistent storage

## 🔧 **Step-by-Step Fix Implementation**

### **Step 1: Fix Backend Service**

#### **1.1 Update Backend Railway Configuration**
Create `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "php artisan serve --host=0.0.0.0 --port=$PORT",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### **1.2 Set Backend Environment Variables**
In Railway Dashboard → Backend Service → Variables:
```
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_32_CHARACTER_KEY_HERE
APP_URL=https://your-backend-url.railway.app
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
SANCTUM_STATEFUL_DOMAINS=your-frontend-url.railway.app
```

#### **1.3 Create Database Directory**
Add to `backend/bootstrap/app.php`:
```php
// Ensure database directory exists
if (!file_exists('/app/database')) {
    mkdir('/app/database', 0755, true);
}
```

### **Step 2: Fix Frontend Service**

#### **2.1 Update Frontend Railway Configuration**
Update root `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd frontend-- && npm install --force && npm run build && npx serve -s dist -l $PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "variables": {
    "VITE_API_URL": "https://your-backend-url.railway.app/api",
    "NODE_ENV": "production"
  }
}
```

#### **2.2 Set Frontend Environment Variables**
In Railway Dashboard → Frontend Service → Variables:
```
VITE_API_URL=https://your-backend-url.railway.app/api
NODE_ENV=production
```

### **Step 3: Database Setup**

#### **3.1 Create Database Migration Script**
Create `backend/database-setup.php`:
```php
<?php
// Ensure database directory exists
$dbDir = '/app/database';
if (!file_exists($dbDir)) {
    mkdir($dbDir, 0755, true);
}

// Create database file if it doesn't exist
$dbFile = $dbDir . '/database.sqlite';
if (!file_exists($dbFile)) {
    touch($dbFile);
    chmod($dbFile, 0644);
}

echo "Database setup complete\n";
?>
```

#### **3.2 Update Backend Start Command**
Modify `backend/railway.json`:
```json
{
  "deploy": {
    "startCommand": "php database-setup.php && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT"
  }
}
```

## 🚨 **Common Railway Errors & Solutions**

### **Error 1: "Cannot Redeploy"**
**Cause**: Railway has already detected changes and created new deployment
**Solution**: Use "Promote" button instead of "Redeploy"

### **Error 2: "Health Check Failed"**
**Cause**: Health check endpoint not accessible
**Solution**: Ensure `/api/health` endpoint exists and returns 200 OK

### **Error 3: "Build Failed"**
**Cause**: Missing dependencies or configuration issues
**Solution**: Check build logs and ensure all dependencies are installed

### **Error 4: "Runtime Error"**
**Cause**: Missing environment variables or database issues
**Solution**: Verify all environment variables are set correctly

### **Error 5: "Port Binding Failed"**
**Cause**: Service can't bind to Railway's assigned port
**Solution**: Use `$PORT` environment variable and `--host=0.0.0.0`

### **Error 6: "Database Connection Failed"**
**Cause**: SQLite database not accessible
**Solution**: Ensure database directory exists and is writable

### **Error 7: "CORS Error"**
**Cause**: Frontend can't communicate with backend
**Solution**: Configure CORS properly in Laravel

### **Error 8: "Memory Limit Exceeded"**
**Cause**: Service runs out of memory
**Solution**: Optimize Laravel configuration and clear caches

## 🔍 **Pre-Deployment Checklist**

### **Backend Checklist**
- [ ] `backend/railway.json` exists and is correct
- [ ] All environment variables are set
- [ ] Database directory setup script exists
- [ ] Health check endpoint works
- [ ] CORS is configured
- [ ] All dependencies are in `composer.json`
- [ ] Application key is generated

### **Frontend Checklist**
- [ ] Root `railway.json` is correct
- [ ] `VITE_API_URL` is set correctly
- [ ] `npm run build` works locally
- [ ] All dependencies are in `package.json`
- [ ] Build output is in `dist` directory

### **Repository Checklist**
- [ ] All changes are committed
- [ ] Repository is pushed to GitHub
- [ ] No sensitive data in repository
- [ ] Configuration files are present

## 🚀 **Deployment Process**

### **Step 1: Deploy Backend**
1. Go to Railway Dashboard
2. Create new project
3. Connect GitHub repository
4. Set root directory to `backend`
5. Set all environment variables
6. Deploy and test health check

### **Step 2: Deploy Frontend**
1. Create new project in Railway
2. Connect same GitHub repository
3. Set root directory to `.` (root)
4. Set `VITE_API_URL` to backend URL
5. Deploy and test frontend

### **Step 3: Test Integration**
1. Test backend health check
2. Test frontend loads correctly
3. Test API communication
4. Test user authentication
5. Test all major features

## 🛠️ **Emergency Fixes**

### **If Backend Won't Start**
```bash
# Check logs in Railway dashboard
# Common fixes:
1. Ensure APP_KEY is set
2. Check database path
3. Verify environment variables
4. Check PHP version compatibility
```

### **If Frontend Won't Build**
```bash
# Check build logs
# Common fixes:
1. Ensure VITE_API_URL is set
2. Check Node.js version
3. Verify all dependencies
4. Check build script
```

### **If Services Can't Communicate**
```bash
# Check CORS configuration
# Common fixes:
1. Update SANCTUM_STATEFUL_DOMAINS
2. Check API URL in frontend
3. Verify CORS middleware
4. Test API endpoints directly
```

## 📊 **Monitoring & Maintenance**

### **Railway Dashboard Monitoring**
- [ ] Both services show "Deployed" status
- [ ] No errors in build logs
- [ ] No errors in runtime logs
- [ ] Health checks are passing
- [ ] Resource usage is normal

### **Application Monitoring**
- [ ] Health check endpoint returns 200 OK
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] User authentication works
- [ ] No console errors in frontend

## 🆘 **Support Resources**

### **Railway Support**
- **Documentation**: https://docs.railway.app
- **Support**: https://railway.app/support
- **Community**: https://discord.gg/railway

### **Laravel Support**
- **Documentation**: https://laravel.com/docs
- **Community**: https://laravel.com/community

### **React Support**
- **Documentation**: https://react.dev
- **Community**: https://react.dev/community

## ✅ **Success Indicators**

Your Railway deployment is successful when:
- ✅ **Backend Status**: "Deployed" in Railway dashboard
- ✅ **Frontend Status**: "Deployed" in Railway dashboard
- ✅ **Health Check**: Returns 200 OK
- ✅ **API Communication**: Frontend can call backend APIs
- ✅ **User Authentication**: Login/logout works
- ✅ **Database**: All operations work correctly
- ✅ **No Errors**: No errors in logs or console

## 🎯 **Final Steps**

1. **Deploy Backend First**: Get backend working and tested
2. **Deploy Frontend Second**: Connect frontend to backend
3. **Test Everything**: Verify all features work
4. **Monitor**: Keep an eye on logs and performance
5. **Document**: Update your deployment documentation

---

**Remember**: Most Railway errors are configuration issues, not code problems. Follow this guide step by step, and your deployment will be successful!
