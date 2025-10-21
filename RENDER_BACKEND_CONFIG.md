# Render Backend Configuration Guide

## 🚀 Render Service Setup

### **Service Configuration:**
- **Type**: Web Service
- **Root Directory**: `backend`
- **Build Command**: `composer install --no-dev --optimize-autoloader`
- **Start Command**: `php artisan serve --host=0.0.0.0 --port=$PORT`

### **Environment Variables:**
```
APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_URL=https://your-backend-url.onrender.com

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=your-postgres-host.onrender.com
DB_PORT=5432
DB_DATABASE=everbright
DB_USERNAME=everbright_user
DB_PASSWORD=your-secure-password

# Cache and Session
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# CORS Configuration
SANCTUM_STATEFUL_DOMAINS=your-frontend-url.netlify.app
```

### **Database Setup:**
1. Create PostgreSQL database in Render
2. Use connection details in environment variables
3. Render will handle database persistence

### **Health Check:**
- **Path**: `/api/health`
- **Expected Response**: 200 OK with JSON status
