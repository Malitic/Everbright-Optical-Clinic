@echo off
cd backend
echo Starting Laravel Backend Server...
php artisan config:clear
php artisan cache:clear
php artisan serve --host=127.0.0.1 --port=8000

