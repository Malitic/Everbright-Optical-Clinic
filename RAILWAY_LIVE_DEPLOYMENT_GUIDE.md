# 🚀 Railway Deployment - Live Guide

## Current Status
✅ Code pushed to GitHub: `protacium05/EverBright-Optical-Clinic-System`  
✅ Railway configuration files ready  
✅ Deployment scripts prepared  
🔄 **Next: Deploy to Railway**

---

## Step 1: Deploy Backend Service

### 1.1 Create Backend Project
1. **Go to [Railway Dashboard](https://railway.app)**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose**: `protacium05/EverBright-Optical-Clinic-System`
5. **Configure**:
   - **Root Directory**: `backend`
   - **Service Name**: `everbright-optical-backend`

### 1.2 Set Environment Variables
Go to your backend service → **Variables** tab → Add these:

```env
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_URL=https://everbright-optical-backend.railway.app
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=stack
LOG_LEVEL=error
```

### 1.3 Monitor Deployment
- Watch the **Build Logs** for any errors
- Wait for **"Deployed"** status
- Note the **generated URL** (e.g., `https://everbright-optical-backend.railway.app`)

### 1.4 Test Backend
Open `test-railway-backend.html` in your browser and test your backend URL.

**Expected Results:**
- ✅ Health check returns 200 OK
- ✅ Main API returns JSON response
- ✅ CORS is configured correctly

---

## Step 2: Deploy Frontend Service

### 2.1 Create Frontend Project
1. **Go to Railway Dashboard**
2. **Click "New Project"** (create a separate project)
3. **Select "Deploy from GitHub repo"**
4. **Choose**: `protacium05/EverBright-Optical-Clinic-System`
5. **Configure**:
   - **Root Directory**: `.` (root directory)
   - **Service Name**: `everbright-optical-frontend`

### 2.2 Set Environment Variables
Go to your frontend service → **Variables** tab → Add these:

```env
VITE_API_URL=https://your-backend-url.railway.app/api
NODE_ENV=production
```

**Important**: Replace `your-backend-url` with your actual backend URL from Step 1.

### 2.3 Monitor Deployment
- Watch the **Build Logs**
- Wait for **"Deployed"** status
- Note the **generated URL** (e.g., `https://everbright-optical-frontend.railway.app`)

---

## Step 3: Test Complete System

### 3.1 Test Frontend
1. **Visit your frontend URL**
2. **Check if the application loads**
3. **Test login functionality**
4. **Verify API calls work**

### 3.2 Common Issues & Solutions

#### Backend Issues:
- **Build fails**: Check PHP version (needs 8.2+)
- **Database error**: Ensure SQLite file exists
- **Health check fails**: Verify `/api/health` route

#### Frontend Issues:
- **Build fails**: Check Node.js version (needs 18+)
- **API calls fail**: Verify `VITE_API_URL` is correct
- **CORS errors**: Check backend CORS configuration

#### Connection Issues:
- **Frontend can't reach backend**: Update `VITE_API_URL`
- **Authentication fails**: Check API endpoints
- **Data not loading**: Verify database migrations

---

## Step 4: Production Configuration

### 4.1 Custom Domains (Optional)
1. **Backend**: Add custom domain in Railway settings
2. **Frontend**: Add custom domain in Railway settings
3. **Update DNS records** to point to Railway

### 4.2 Monitoring Setup
1. **Check Railway logs** regularly
2. **Monitor resource usage**
3. **Set up alerts** for failed deployments

### 4.3 Backup Strategy
1. **Database backups**: Export SQLite data regularly
2. **Code backups**: GitHub already handles this
3. **Environment variables**: Document all settings

---

## 🎯 Success Checklist

Your deployment is successful when:

- ✅ Backend service shows "Deployed" status
- ✅ Frontend service shows "Deployed" status
- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ Login functionality works
- ✅ API calls succeed from frontend
- ✅ No errors in Railway logs

---

## 📞 Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Support**: https://railway.app/support
- **Test Backend**: Use `test-railway-backend.html`
- **Deployment Logs**: Check Railway dashboard

---

## 🚨 Emergency Contacts

If you encounter issues:
1. **Check Railway logs** first
2. **Verify environment variables**
3. **Test endpoints individually**
4. **Contact Railway support** if needed

---

**Ready to deploy? Start with Step 1 and follow each step carefully!**
