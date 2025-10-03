#!/bin/bash

echo "=== STARTING SERVER AND FIXING SCHEDULES ==="

# Clear caches
echo "Clearing Laravel caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Check routes
echo "Checking routes..."
php artisan route:list | grep schedules

# Create schedule data
echo "Creating schedule data..."
php fix_schedules.php

# Test API
echo "Testing API..."
curl "http://127.0.0.1:8000/api/schedules"

echo "=== DONE ==="
echo "Now start the server with: php artisan serve --host=127.0.0.1 --port=8000"
