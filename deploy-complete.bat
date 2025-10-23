@echo off
REM 🚀 Complete Railway Deployment Script for Everbright Optical System
REM This script deploys both backend and frontend to Railway

echo 🚀 Starting complete Railway deployment for Everbright Optical System...

REM Check if we're in the right directory
if not exist "backend\artisan" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "frontend--\package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Railway CLI...
    npm install -g @railway/cli
)

REM Login to Railway
echo 🔐 Logging into Railway...
railway login

REM Create Railway project
echo 🏗️ Creating Railway project...
railway init

REM Deploy backend
echo 🚀 Deploying backend to Railway...
cd backend
railway up --detach
for /f "tokens=*" %%i in ('railway domain') do set BACKEND_URL=%%i
echo ✅ Backend deployed at: %BACKEND_URL%
cd ..

REM Deploy frontend
echo 🚀 Deploying frontend to Railway...
cd frontend--
railway up --detach
for /f "tokens=*" %%i in ('railway domain') do set FRONTEND_URL=%%i
echo ✅ Frontend deployed at: %FRONTEND_URL%
cd ..

REM Set up environment variables
echo ⚙️ Setting up environment variables...

REM Backend environment variables
railway variables set APP_NAME="Everbright Optical System"
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false
railway variables set APP_URL=%BACKEND_URL%

REM Generate and set application key
echo 🔑 Generating application key...
cd backend
for /f "tokens=*" %%i in ('php artisan key:generate --show') do set APP_KEY=%%i
railway variables set APP_KEY=%APP_KEY%
cd ..

REM Database setup
echo 🗄️ Setting up MySQL database...
railway add mysql
echo ⚠️ Please set the following database variables in Railway dashboard:
echo    - DB_HOST (from MySQL service)
echo    - DB_DATABASE (from MySQL service)
echo    - DB_USERNAME (from MySQL service)
echo    - DB_PASSWORD (from MySQL service)

REM Redis setup
echo 🔄 Setting up Redis cache...
railway add redis
echo ⚠️ Please set the following Redis variables in Railway dashboard:
echo    - REDIS_HOST (from Redis service)
echo    - REDIS_PASSWORD (from Redis service)

REM CORS setup
echo 🌐 Setting up CORS configuration...
railway variables set CORS_ALLOWED_ORIGINS=%FRONTEND_URL%

REM Frontend environment variables
echo ⚙️ Setting up frontend environment variables...
cd frontend--
railway variables set VITE_API_URL=%BACKEND_URL%/api
cd ..

REM Run database migrations
echo 🗄️ Running database migrations...
cd backend
railway run php artisan migrate --force
echo ✅ Database migrations completed
cd ..

REM Build frontend
echo 🏗️ Building frontend...
cd frontend--
npm run build
echo ✅ Frontend build completed
cd ..

echo 🎉 Deployment completed successfully!
echo.
echo 📋 Deployment Summary:
echo   Backend URL: %BACKEND_URL%
echo   Frontend URL: %FRONTEND_URL%
echo   API Endpoint: %BACKEND_URL%/api
echo.
echo 📝 Next Steps:
echo   1. Set database variables in Railway dashboard
echo   2. Set Redis variables in Railway dashboard
echo   3. Test your application
echo   4. Set up custom domains (optional)
echo.
echo 🔗 Railway Dashboard: https://railway.app/dashboard
echo 📚 Documentation: https://docs.railway.app
echo.
echo ✅ Your Everbright Optical System is now live on Railway! 🚀
pause
