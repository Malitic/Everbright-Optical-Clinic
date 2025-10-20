# 🚨 Railway 502 Error - Emergency Fix Guide

## 🚨 **Current Issue**
- **Error**: 502 Bad Gateway
- **Cause**: "connection refused" - service not running
- **URL**: web-production-63b12.up.railway.app
- **Status**: Service is down

## 🔧 **Immediate Fix Steps**

### **Step 1: Check Railway Dashboard**
1. Go to [Railway Dashboard](https://railway.app)
2. Find your project: `web-production-63b12`
3. Check service status:
   - Should show "Deployed" or "Building"
   - If shows "Failed" or "Crashed" → Service is down

### **Step 2: Check Service Logs**
1. In Railway Dashboard → Your Service
2. Go to "Deployments" tab
3. Click on latest deployment
4. Check "Build Logs" and "Runtime Logs"
5. Look for error messages

### **Step 3: Common Fixes**

#### **Fix 1: Service Not Starting**
**Problem**: Service crashes on startup
**Solution**: Check start command and environment variables

#### **Fix 2: Port Binding Issues**
**Problem**: Service can't bind to Railway's port
**Solution**: Ensure you're using `$PORT` environment variable

#### **Fix 3: Missing Dependencies**
**Problem**: Build fails or runtime errors
**Solution**: Check package.json/composer.json

#### **Fix 4: Environment Variables**
**Problem**: Missing critical environment variables
**Solution**: Set all required variables in Railway dashboard

## 🚀 **Quick Recovery Actions**

### **Action 1: Restart Service**
1. Go to Railway Dashboard
2. Find your service
3. Click "Redeploy" or "Restart"
4. Wait for deployment to complete

### **Action 2: Check Configuration**
Verify your service configuration:
- Start command is correct
- Environment variables are set
- Health check path exists

### **Action 3: Test Health Check**
Once service is running, test:
```
https://web-production-63b12.up.railway.app/api/health
```

## 🔍 **Diagnostic Commands**

### **Check Service Status**
```bash
# In Railway Dashboard → Service → Logs
# Look for these patterns:
- "Starting service..."
- "Service listening on port..."
- "Health check passed"
```

### **Test Endpoints**
```bash
# Test main endpoint
curl https://web-production-63b12.up.railway.app/

# Test health check
curl https://web-production-63b12.up.railway.app/api/health

# Test API
curl https://web-production-63b12.up.railway.app/api/
```

## 🛠️ **Specific Fixes for Your Setup**

### **Backend Service Fix**
If this is your backend service:
1. **Check start command**: Should be `php artisan serve --host=0.0.0.0 --port=$PORT`
2. **Check environment variables**:
   ```
   APP_NAME=Everbright Optical System
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:YOUR_KEY_HERE
   DB_CONNECTION=sqlite
   ```
3. **Check health check**: `/api/health` should return 200 OK

### **Frontend Service Fix**
If this is your frontend service:
1. **Check start command**: Should build and serve static files
2. **Check environment variables**:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   NODE_ENV=production
   ```

## 🚨 **Emergency Recovery**

### **If Service Won't Start**
1. **Check logs** for specific error messages
2. **Verify configuration** files are correct
3. **Test locally** to ensure code works
4. **Redeploy** with fixed configuration

### **If Build Fails**
1. **Check dependencies** in package.json/composer.json
2. **Verify build script** works locally
3. **Check Node.js/PHP version** compatibility
4. **Fix build errors** and redeploy

### **If Runtime Errors**
1. **Check environment variables** are set
2. **Verify database connection** works
3. **Check file permissions** and paths
4. **Review error logs** for specific issues

## 📊 **Monitoring After Fix**

### **Success Indicators**
- ✅ Service shows "Deployed" status
- ✅ Health check returns 200 OK
- ✅ No errors in logs
- ✅ Website loads correctly

### **Ongoing Monitoring**
- Check Railway dashboard regularly
- Monitor logs for errors
- Test endpoints periodically
- Set up uptime monitoring

## 🆘 **If Still Having Issues**

### **Contact Railway Support**
1. Go to [Railway Support](https://railway.app/support)
2. Provide your service URL and error logs
3. Include deployment logs and configuration

### **Alternative Solutions**
1. **Redeploy from scratch** with clean configuration
2. **Use different Railway region** if available
3. **Check Railway status** for platform issues
4. **Consider alternative platform** if Railway continues to fail

## 🎯 **Prevention for Future**

### **Best Practices**
1. **Test locally** before deploying
2. **Use health checks** for monitoring
3. **Set up proper logging** for debugging
4. **Monitor service status** regularly
5. **Keep configuration simple** and documented

### **Regular Maintenance**
1. **Update dependencies** regularly
2. **Monitor resource usage**
3. **Check logs** for warnings
4. **Test deployments** in staging first

---

## 🚀 **Next Steps**

1. **Go to Railway Dashboard** and check service status
2. **Review logs** for specific error messages
3. **Apply appropriate fix** based on error type
4. **Test service** once it's running
5. **Monitor** to ensure it stays stable

**Remember**: 502 errors usually mean the service isn't running. Check the logs first to see why it's not starting!
