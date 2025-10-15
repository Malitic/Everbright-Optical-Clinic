# 🔧 Troubleshooting 404 NOT_FOUND Error

## 🚨 **Error Details**
- **Error**: 404 NOT_FOUND
- **Code**: NOT_FOUND
- **ID**: sin1::qpv4x-1760518461170-2df7be7f37b2

## 🎯 **Common Causes & Solutions**

### **1. Railway Deployment Issues**

#### **Problem**: Railway can't find the application
#### **Solution**: 
1. **Check Root Directory**: Ensure Railway is set to `backend` directory
2. **Verify Build Command**: Use `composer install --no-dev --optimize-autoloader`
3. **Check Start Command**: Use `php artisan key:generate --force && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`

#### **Railway Configuration**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "php artisan key:generate --force && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

### **2. Environment Variables Missing**

#### **Required Environment Variables**:
```
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:your-generated-key
DB_CONNECTION=sqlite
```

#### **How to Set**:
1. Go to Railway Dashboard
2. Select your project
3. Go to Variables tab
4. Add each variable

### **3. Database Issues**

#### **Problem**: SQLite database not accessible
#### **Solution**:
1. **Check Database Path**: Ensure `DB_DATABASE=/app/database/database.sqlite`
2. **Run Migrations**: The start command includes `php artisan migrate --force`
3. **Check Permissions**: Railway handles this automatically

### **4. Laravel Application Key**

#### **Problem**: Missing or invalid APP_KEY
#### **Solution**: 
The updated start command includes `php artisan key:generate --force`

### **5. Health Check Endpoint**

#### **New Health Check Routes**:
- **Main Route**: `/` - Returns API status
- **Health Check**: `/health` - Returns health status

#### **Expected Response**:
```json
{
  "status": "healthy",
  "service": "Everbright Optical System",
  "timestamp": "2024-01-15T10:30:00.000000Z"
}
```

## 🚀 **Step-by-Step Fix**

### **Step 1: Update Railway Configuration**
1. Go to Railway Dashboard
2. Select your project
3. Go to Settings → Deploy
4. Update the start command to:
   ```bash
   php artisan key:generate --force && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
   ```

### **Step 2: Set Environment Variables**
Add these variables in Railway:
```
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=sqlite
```

### **Step 3: Redeploy**
1. Go to Railway Dashboard
2. Click "Redeploy" or push new code
3. Wait for deployment to complete

### **Step 4: Test Endpoints**
1. **Main API**: `https://your-app.railway.app/`
2. **Health Check**: `https://your-app.railway.app/health`
3. **API Routes**: `https://your-app.railway.app/api/`

## 🔍 **Debugging Steps**

### **1. Check Railway Logs**
1. Go to Railway Dashboard
2. Select your project
3. Go to Deployments tab
4. Click on latest deployment
5. Check build and runtime logs

### **2. Test Locally First**
```bash
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

### **3. Verify File Structure**
Ensure these files exist:
- `backend/composer.json`
- `backend/artisan`
- `backend/public/index.php`
- `backend/routes/web.php`
- `backend/routes/api.php`

## 🆘 **If Still Getting 404**

### **Alternative Deployment Method**:
1. **Use Heroku** instead of Railway
2. **Use Render** as backup option
3. **Use DigitalOcean App Platform**

### **Quick Heroku Deployment**:
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set APP_NAME="Everbright Optical System"
heroku config:set APP_ENV=production
heroku config:set APP_DEBUG=false
heroku config:set DB_CONNECTION=sqlite

# Deploy
git subtree push --prefix backend heroku main
```

## ✅ **Success Indicators**

Your deployment is successful when:
- ✅ Railway shows "Deployed" status
- ✅ Health check returns 200 OK
- ✅ Main route returns JSON response
- ✅ API routes are accessible
- ✅ No 404 errors in logs

## 📞 **Need More Help?**

If you're still experiencing issues:
1. Check Railway documentation
2. Review Laravel deployment guide
3. Check GitHub issues for similar problems
4. Contact Railway support

---

**Note**: The updated configuration files should resolve the 404 error. Make sure to redeploy after making these changes.
