@echo off
REM Railway Deployment Script for Everbright Optical System (Windows)
REM This script helps prepare and deploy both backend and frontend to Railway

echo 🚀 Everbright Optical System - Railway Deployment Script
echo ==================================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo [ERROR] Backend directory not found
    pause
    exit /b 1
)

if not exist "frontend--" (
    echo [ERROR] Frontend directory not found
    pause
    exit /b 1
)

echo [INFO] Starting deployment preparation...

REM Step 1: Prepare Backend
echo [INFO] Preparing backend for deployment...

cd backend

REM Check if composer is installed
composer --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Composer not found. Please install Composer first.
    echo [INFO] Visit: https://getcomposer.org/download/
    pause
    exit /b 1
)

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
composer install --no-dev --optimize-autoloader

REM Generate application key if not exists
if not exist ".env" (
    echo [INFO] Creating .env file...
    echo APP_NAME=Everbright Optical System > .env
    echo APP_ENV=production >> .env
    echo APP_DEBUG=false >> .env
    echo APP_KEY= >> .env
    echo DB_CONNECTION=sqlite >> .env
    echo DB_DATABASE=/app/database/database.sqlite >> .env
    echo CACHE_DRIVER=file >> .env
    echo SESSION_DRIVER=file >> .env
    echo QUEUE_CONNECTION=sync >> .env
)

REM Generate app key
echo [INFO] Generating application key...
php artisan key:generate --force

REM Run migrations
echo [INFO] Running database migrations...
php artisan migrate --force

REM Clear caches
echo [INFO] Clearing application caches...
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

cd ..

echo [SUCCESS] Backend preparation completed!

REM Step 2: Prepare Frontend
echo [INFO] Preparing frontend for deployment...

cd frontend--

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] npm not found. Please install Node.js and npm first.
    echo [INFO] Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
npm install --force

REM Build frontend
echo [INFO] Building frontend for production...
npm run build

cd ..

echo [SUCCESS] Frontend preparation completed!

REM Step 3: Create deployment package
echo [INFO] Creating deployment package...

REM Create a temporary directory for deployment
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "DEPLOY_DIR=railway-deploy-%YYYY%%MM%%DD%-%HH%%Min%%Sec%"

mkdir "%DEPLOY_DIR%"

REM Copy backend files
echo [INFO] Copying backend files...
xcopy backend "%DEPLOY_DIR%\backend\" /E /I /Q

REM Copy frontend files
echo [INFO] Copying frontend files...
xcopy frontend-- "%DEPLOY_DIR%\frontend--\" /E /I /Q

REM Copy root configuration files
echo [INFO] Copying configuration files...
copy railway.json "%DEPLOY_DIR%\" >nul
copy package.json "%DEPLOY_DIR%\" >nul
copy composer.json "%DEPLOY_DIR%\" >nul
copy Procfile "%DEPLOY_DIR%\" >nul 2>nul

REM Create README for deployment
echo # Railway Deployment Package > "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo. >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo This package contains both backend and frontend ready for Railway deployment. >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo. >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo ## Backend Deployment >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo 1. Create new Railway project >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo 2. Set root directory to: backend >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo 3. Deploy >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo. >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo ## Frontend Deployment >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo 1. Create new Railway project >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo 2. Set root directory to: . (root) >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo 3. Deploy >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo. >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo ## Environment Variables >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo. >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo ### Backend Variables: >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo - APP_NAME=Everbright Optical System >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo - APP_ENV=production >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo - APP_DEBUG=false >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo - DB_CONNECTION=sqlite >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo - DB_DATABASE=/app/database/database.sqlite >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo. >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo ### Frontend Variables: >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo - VITE_API_URL=https://your-backend-url.railway.app/api >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"
echo - NODE_ENV=production >> "%DEPLOY_DIR%\README-DEPLOYMENT.md"

echo [SUCCESS] Deployment package created: %DEPLOY_DIR%

REM Step 4: Display next steps
echo.
echo 🎯 Next Steps:
echo ==============
echo.
echo 1. Go to Railway Dashboard: https://railway.app
echo.
echo 2. Deploy Backend:
echo    - Create new project
echo    - Connect GitHub repo
echo    - Set root directory to: backend
echo    - Name: everbright-optical-backend
echo.
echo 3. Deploy Frontend:
echo    - Create new project
echo    - Connect GitHub repo
echo    - Set root directory to: . (root)
echo    - Name: everbright-optical-frontend
echo.
echo 4. Set Environment Variables (see README-DEPLOYMENT.md)
echo.
echo 5. Test your deployment:
echo    - Backend: https://your-backend-name.railway.app/api/health
echo    - Frontend: https://your-frontend-name.railway.app
echo.

echo [SUCCESS] Deployment preparation completed!
echo [INFO] Check the %DEPLOY_DIR% directory for deployment files
echo [INFO] Follow the steps above to deploy to Railway

REM Optional: Open Railway dashboard
set /p "open_dashboard=Would you like to open Railway dashboard? (y/n): "
if /i "%open_dashboard%"=="y" (
    start https://railway.app
)

echo.
echo [SUCCESS] Script completed successfully! 🎉
pause
