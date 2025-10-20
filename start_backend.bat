@echo off
cd backend
echo Starting Laravel Backend Server...
php artisan config:clear
php artisan cache:clear
php artisan serve --host=0.0.0.0 --port=8000

