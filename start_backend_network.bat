@echo off
echo Starting Everbright Backend Server...
echo.

cd backend
echo Current directory: %CD%
echo.

echo Checking if artisan exists...
if exist artisan (
    echo ✅ artisan file found
) else (
    echo ❌ artisan file not found
    echo Please make sure you're in the correct Laravel directory
    pause
    exit
)

echo.
echo Starting Laravel server on all interfaces (0.0.0.0:8000)...
echo This will allow connections from other devices on the network
echo.

php artisan serve --host=0.0.0.0 --port=8000

echo.
echo Server stopped.
pause

