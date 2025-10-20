@echo off
echo === STARTING SERVER AND FIXING SCHEDULES ===

REM Clear caches
echo Clearing Laravel caches...
php artisan config:clear
php artisan route:clear
php artisan cache:clear

REM Check routes
echo Checking routes...
php artisan route:list | findstr schedules

REM Create schedule data
echo Creating schedule data...
php fix_schedules.php

REM Test API
echo Testing API...
curl "http://0.0.0.0:8000/api/schedules"

echo === DONE ===
echo Now start the server with: php artisan serve --host=0.0.0.0 --port=8000
pause
