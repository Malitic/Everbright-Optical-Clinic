#!/bin/bash

# Wait for database to be ready
echo "Waiting for database connection..."
sleep 5

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

# Start Laravel server
echo "Starting Laravel server..."
php artisan serve --host=0.0.0.0 --port=$PORT
