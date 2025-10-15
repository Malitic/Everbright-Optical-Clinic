# 🚀 Everbright Optical System - Deployment Project Names

## 📋 **Recommended Project Names**

### **Railway (Backend) Project Names:**
Choose one of these names for your Railway project:

1. `everbright-optical-backend`
2. `everbright-optical-api`
3. `everbright-backend-system`
4. `optical-system-backend`
5. `everbright-clinic-backend`

### **Vercel (Frontend) Project Names:**
Choose one of these names for your Vercel project:

1. `everbright-optical-frontend`
2. `everbright-optical-app`
3. `everbright-frontend-system`
4. `optical-system-frontend`
5. `everbright-clinic-frontend`

## 🎯 **Deployment Steps with Correct Names**

### **Step 1: Deploy Backend to Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**: `protacium05/beach-thesis`
6. **Project Name**: Use one of the backend names above (e.g., `everbright-optical-backend`)
7. **Configure the project**:
   - **Root Directory**: `backend`
   - **Build Command**: `composer install --no-dev --optimize-autoloader`
   - **Start Command**: `php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`

8. **Set Environment Variables** in Railway dashboard:
   ```
   APP_NAME=Everbright Optical System
   APP_ENV=production
   APP_DEBUG=false
   DB_CONNECTION=sqlite
   ```

9. **Deploy** and wait for completion
10. **Copy the Railway URL** (e.g., `https://everbright-optical-backend.railway.app`)

### **Step 2: Deploy Frontend to Vercel**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your GitHub repository**: `protacium05/beach-thesis`
5. **Project Name**: Use one of the frontend names above (e.g., `everbright-optical-frontend`)
6. **Configure the project**:
   - **Root Directory**: `frontend--`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

7. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```
   (Replace with your actual Railway URL from Step 1)

8. **Deploy** and wait for completion
9. **Copy the Vercel URL** (e.g., `https://everbright-optical-frontend.vercel.app`)

## ✅ **Naming Rules Compliance**

All suggested names follow the requirements:
- ✅ **Lowercase only**
- ✅ **Letters and hyphens only**
- ✅ **No triple dashes (---)**
- ✅ **Under 100 characters**
- ✅ **Descriptive and professional**

## 🔄 **After Deployment**

Once both are deployed, you'll have:
- **Frontend URL**: `https://everbright-optical-frontend.vercel.app`
- **Backend URL**: `https://everbright-optical-backend.railway.app`

## 🆘 **If Names Are Taken**

If any name is already taken, try these alternatives:
- Add your initials: `everbright-optical-backend-pt`
- Add numbers: `everbright-optical-backend-2024`
- Use underscores: `everbright_optical_backend`

## 📱 **Share with IT Expert**

Provide your IT expert with:
- **Frontend URL**: For user interface testing
- **Backend API URL**: For API testing
- **Test credentials**: (if you have any seeded users)

---

**Note**: These names are professional, descriptive, and follow all platform naming conventions. Choose the ones you prefer!
