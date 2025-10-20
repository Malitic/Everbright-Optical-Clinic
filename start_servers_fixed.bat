@echo off
echo Starting Everbright System...

echo.
echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "php artisan serve --host=0.0.0.0 --port=8000"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Backend should be running on:
echo   - http://127.0.0.1:8000
echo   - http://localhost:8000
echo   - http://192.168.100.6:8000 (if accessible from network)

echo.
echo Starting Frontend Server...
cd ..\frontend--
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Frontend will be available at: http://localhost:5173
echo.
echo If you get connection errors:
echo 1. Make sure backend is running on port 8000
echo 2. Check Windows Firewall settings
echo 3. Update frontend/.env with correct VITE_API_URL
echo.
pause

