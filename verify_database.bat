@echo off
echo ========================================
echo   Database Verification Script
echo ========================================
echo.

echo [1/2] Checking migration status...
cd backend
php artisan migrate:status

echo.
echo [2/2] Running any pending migrations...
php artisan migrate

echo.
echo ========================================
echo   Verification Complete!
echo ========================================
echo.
echo If you see any errors above, please:
echo 1. Check your database connection in backend/.env
echo 2. Ensure your database server is running
echo 3. Try running: php artisan migrate:fresh --seed (WARNING: This will clear all data!)
echo.
cd ..
pause

