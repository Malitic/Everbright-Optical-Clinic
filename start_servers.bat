@echo off
echo Starting Product Management System...
echo.

echo Starting Database API Server (Port 8002)...
start "Database API Server" cmd /k "php -S 0.0.0.0:8002 database_api_server.php"

echo Starting Simple API Server (Port 8001)...
start "Simple API Server" cmd /k "php -S 0.0.0.0:8001 simple_api_server.php"

echo.
echo Servers are starting...
echo.
echo Database API Server: http://127.0.0.1:8002 (Laravel database)
echo Simple API Server: http://127.0.0.1:8001 (Image uploads)
echo.
echo Open test_product_management.html in your browser to test the system
echo.
pause

