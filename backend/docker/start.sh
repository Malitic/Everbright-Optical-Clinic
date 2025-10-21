#!/bin/bash

# Wait for MySQL to be ready (if using external database)
echo "Waiting for MySQL connection..."
while ! php artisan migrate:status > /dev/null 2>&1; do
    echo "MySQL not ready, waiting..."
    sleep 2
done

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# Clear and cache configuration
echo "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start Apache
echo "Starting Apache server..."
apache2-foreground
