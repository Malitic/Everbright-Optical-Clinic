# Netlify Frontend Configuration Guide

## 🌐 Netlify Service Setup

### **Site Configuration:**
- **Build Command**: `cd frontend-- && npm install && npm run build`
- **Publish Directory**: `frontend--/dist`
- **Node Version**: 18.x

### **Environment Variables:**
```
VITE_API_URL=https://your-backend-url.onrender.com/api
NODE_ENV=production
```

### **Build Settings:**
- **Base Directory**: `.` (root)
- **Build Command**: `cd frontend-- && npm install && npm run build`
- **Publish Directory**: `frontend--/dist`

### **Redirects Configuration:**
Create `frontend--/public/_redirects`:
```
/*    /index.html   200
```

### **Headers Configuration:**
Create `frontend--/public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### **Deployment Process:**
1. Connect GitHub repository
2. Set build settings
3. Add environment variables
4. Deploy automatically on push
