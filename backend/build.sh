#!/bin/bash
set -e

echo "Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

echo "Generating application key..."
php artisan key:generate --force

echo "Running database migrations..."
php artisan migrate --force

echo "Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo "Build completed successfully!"
