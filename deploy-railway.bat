@echo off
REM Railway Deployment Script for Everbright Optical System

echo 🚀 Starting Railway deployment...

REM Check if we're in the right directory
if not exist "backend\artisan" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Install Railway CLI if not present
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Railway CLI...
    npm install -g @railway/cli
)

REM Login to Railway
echo 🔐 Logging into Railway...
railway login

REM Initialize Railway project
echo 🏗️ Initializing Railway project...
railway init

REM Set environment variables
echo ⚙️ Setting up environment variables...
railway variables set APP_NAME="Everbright Optical System"
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false

REM Generate application key
echo 🔑 Generating application key...
cd backend
php artisan key:generate --show
cd ..

echo 📝 Please copy the generated APP_KEY and set it in Railway dashboard
echo 📝 Also set the following variables in Railway:
echo    - DB_HOST (from MySQL service)
echo    - DB_DATABASE (from MySQL service)
echo    - DB_USERNAME (from MySQL service)
echo    - DB_PASSWORD (from MySQL service)
echo    - REDIS_HOST (from Redis service)
echo    - REDIS_PASSWORD (from Redis service)

REM Deploy to Railway
echo 🚀 Deploying to Railway...
railway up

echo ✅ Deployment complete!
echo 🌐 Your app will be available at: https://your-app.railway.app
pause
