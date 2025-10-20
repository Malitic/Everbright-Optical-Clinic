# 🚨 Railway Service Crash Prevention Guide

## Common Reasons Railway Services Crash After Deployment

### 1. **Health Check Failures** ✅ FIXED
**Problem**: Railway can't reach the health check endpoint
**Solution**: Added `/api/health` endpoint that returns JSON status

### 2. **Database Connection Issues**
**Problem**: SQLite database not accessible or corrupted
**Solutions**:
- Ensure database file exists and is writable
- Check database path in environment variables
- Verify migrations ran successfully

### 3. **Memory Issues**
**Problem**: Service runs out of memory
**Solutions**:
- Optimize Laravel configuration
- Clear caches regularly
- Use `--no-dev` flag for composer install

### 4. **Port Binding Issues**
**Problem**: Service can't bind to Railway's assigned port
**Solutions**:
- Use `$PORT` environment variable
- Ensure `--host=0.0.0.0` is set
- Check start command configuration

### 5. **Environment Variable Issues**
**Problem**: Missing or incorrect environment variables
**Solutions**:
- Verify all required variables are set
- Check variable names match Laravel config
- Ensure production environment is set

### 6. **Dependency Issues**
**Problem**: Missing PHP extensions or packages
**Solutions**:
- Include all required PHP extensions
- Verify composer dependencies
- Check package-lock.json is in sync

### 7. **File Permission Issues**
**Problem**: Laravel can't write to storage/logs
**Solutions**:
- Ensure storage directory is writable
- Check file permissions
- Use proper user permissions

## 🔧 **Prevention Checklist**

### **Before Deployment:**
- [ ] Health check endpoint exists and works
- [ ] All environment variables are set
- [ ] Database migrations are ready
- [ ] Composer dependencies are installed
- [ ] PHP extensions are configured
- [ ] Storage directories are writable

### **After Deployment:**
- [ ] Check Railway logs for errors
- [ ] Test health check endpoint
- [ ] Verify database connection
- [ ] Test API endpoints
- [ ] Monitor memory usage
- [ ] Check service status

## 🚨 **Emergency Debugging Steps**

### **1. Check Railway Logs**
```bash
# In Railway Dashboard:
# Go to your service → Deployments → View Logs
```

### **2. Test Health Check**
```bash
curl https://your-backend-url.railway.app/api/health
```

### **3. Check Service Status**
```bash
# In Railway Dashboard:
# Go to your service → Check "Deployed" status
```

### **4. Verify Environment Variables**
```bash
# In Railway Dashboard:
# Go to your service → Variables tab
# Ensure all required variables are set
```

## 🛠️ **Common Fixes**

### **Fix 1: Add Health Check Endpoint**
```php
// In routes/api.php
Route::get('/health', function() {
    return response()->json([
        'status' => 'healthy',
        'service' => 'Everbright Optical System',
        'timestamp' => now()->toISOString()
    ]);
});
```

### **Fix 2: Optimize Laravel Configuration**
```php
// In config/app.php
'env' => env('APP_ENV', 'production'),
'debug' => env('APP_DEBUG', false),
```

### **Fix 3: Ensure Proper Start Command**
```json
// In railway.json
"startCommand": "php artisan serve --host=0.0.0.0 --port=$PORT"
```

### **Fix 4: Set Required Environment Variables**
```env
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite
```

## 📊 **Monitoring Your Service**

### **Railway Dashboard:**
1. **Service Status**: Should show "Deployed"
2. **Health Check**: Should return 200 OK
3. **Logs**: Check for any error messages
4. **Metrics**: Monitor CPU and memory usage

### **External Monitoring:**
1. **Uptime Monitoring**: Use services like UptimeRobot
2. **Error Tracking**: Implement error logging
3. **Performance Monitoring**: Track response times

## 🎯 **Success Indicators**

Your Railway service is healthy when:
- ✅ **Status**: "Deployed" in Railway dashboard
- ✅ **Health Check**: Returns 200 OK
- ✅ **Logs**: No error messages
- ✅ **API Endpoints**: Respond correctly
- ✅ **Database**: Connection successful
- ✅ **Memory**: Stable usage

## 🆘 **If Service Still Crashes**

1. **Check Railway Logs** for specific error messages
2. **Verify Environment Variables** are correctly set
3. **Test Health Check** endpoint manually
4. **Check Database** connection and permissions
5. **Contact Railway Support** if issues persist

---

**Remember**: Most crashes are caused by configuration issues, not code problems. The health check endpoint we added should resolve the most common crash cause!
