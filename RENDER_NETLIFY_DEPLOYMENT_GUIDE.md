# 🚀 Render + Netlify Deployment Guide

## 📋 **Complete Setup Instructions**

### **🎯 Overview**
- **Backend**: Laravel API on Render
- **Frontend**: React App on Netlify
- **Database**: PostgreSQL on Render
- **Domain**: Custom domains supported

---

## 🔧 **Step 1: Render Backend Setup**

### **1.1 Create Render Account**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your repository

### **1.2 Create PostgreSQL Database**
1. Click "New" → "PostgreSQL"
2. Name: `everbright-database`
3. Note the connection details:
   - Host, Port, Database, Username, Password

### **1.3 Create Web Service**
1. Click "New" → "Web Service"
2. Connect GitHub repository
3. **Settings**:
   - **Name**: `everbright-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `composer install --no-dev --optimize-autoloader`
   - **Start Command**: `php artisan serve --host=0.0.0.0 --port=$PORT`

### **1.4 Environment Variables**
Add these in Render Dashboard → Your Service → Environment:

```
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_URL=https://everbright-backend.onrender.com

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=your-postgres-host.onrender.com
DB_PORT=5432
DB_DATABASE=everbright
DB_USERNAME=everbright_user
DB_PASSWORD=your-password

# Cache and Session
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# CORS Configuration
SANCTUM_STATEFUL_DOMAINS=everbright-frontend.netlify.app
```

### **1.5 Generate APP_KEY**
Run locally:
```bash
cd backend
php artisan key:generate --show
```
Copy the generated key to Render environment variables.

---

## 🌐 **Step 2: Netlify Frontend Setup**

### **2.1 Create Netlify Account**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Connect your repository

### **2.2 Create New Site**
1. Click "New site from Git"
2. Choose GitHub
3. Select your repository

### **2.3 Build Settings**
- **Base Directory**: `.` (root)
- **Build Command**: `cd frontend-- && npm install && npm run build`
- **Publish Directory**: `frontend--/dist`

### **2.4 Environment Variables**
Add these in Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_API_URL=https://everbright-backend.onrender.com/api
NODE_ENV=production
```

### **2.5 Custom Domain (Optional)**
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS settings

---

## 🔗 **Step 3: Connect Frontend to Backend**

### **3.1 Update Frontend API URL**
Make sure your frontend uses the Render backend URL:
```javascript
// In your frontend code
const API_URL = import.meta.env.VITE_API_URL || 'https://everbright-backend.onrender.com/api'
```

### **3.2 Test Connection**
1. Deploy both services
2. Test API calls from frontend
3. Check CORS configuration

---

## 🧪 **Step 4: Testing**

### **4.1 Backend Testing**
Test these endpoints:
```bash
# Health check
curl https://everbright-backend.onrender.com/api/health

# API endpoints
curl https://everbright-backend.onrender.com/api/
```

### **4.2 Frontend Testing**
1. Visit your Netlify URL
2. Test login functionality
3. Test API communication
4. Check console for errors

### **4.3 Integration Testing**
1. Test user authentication
2. Test data flow between services
3. Test file uploads (if applicable)
4. Test real-time features (if applicable)

---

## 📊 **Step 5: Monitoring**

### **5.1 Render Monitoring**
- Check service logs
- Monitor resource usage
- Set up uptime monitoring

### **5.2 Netlify Monitoring**
- Check build logs
- Monitor site performance
- Set up form notifications (if applicable)

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Backend Issues:**
- **Build fails**: Check composer.json and dependencies
- **Database connection**: Verify PostgreSQL credentials
- **CORS errors**: Check SANCTUM_STATEFUL_DOMAINS

#### **Frontend Issues:**
- **Build fails**: Check package.json and dependencies
- **API calls fail**: Verify VITE_API_URL is correct
- **Routing issues**: Check _redirects file

#### **Integration Issues:**
- **Authentication fails**: Check CORS configuration
- **Data not loading**: Verify API endpoints
- **File uploads fail**: Check file size limits

---

## ✅ **Success Checklist**

- [ ] Render backend deployed successfully
- [ ] PostgreSQL database connected
- [ ] Health check endpoint working
- [ ] Netlify frontend deployed successfully
- [ ] Frontend can communicate with backend
- [ ] User authentication working
- [ ] All major features functional
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring set up

---

## 🎯 **Benefits of This Setup**

- ✅ **Reliable**: Both platforms are very stable
- ✅ **Scalable**: Easy to upgrade plans
- ✅ **Fast**: CDN and optimized hosting
- ✅ **Secure**: Built-in security features
- ✅ **Free**: Both have generous free tiers
- ✅ **Easy**: Simple deployment process

---

## 📞 **Support Resources**

- **Render Documentation**: https://render.com/docs
- **Netlify Documentation**: https://docs.netlify.com
- **Laravel Documentation**: https://laravel.com/docs
- **React Documentation**: https://react.dev

---

**Ready to deploy!** Follow these steps and your Everbright Optical System will be live on Render + Netlify!
