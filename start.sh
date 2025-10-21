#!/bin/bash

echo "🚀 Starting Everbright Optical System..."

# Build frontend
echo "📦 Building frontend..."
cd frontend--
npm install
npm run build
echo "✅ Frontend built successfully"

# Go back to root
cd ..

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
    echo "🔑 Generating application key..."
    cd backend
    php artisan key:generate --force
    cd ..
fi

# Run database migrations
echo "🗄️ Running database migrations..."
cd backend
php artisan migrate --force

# Clear and cache configuration
echo "⚡ Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start the application
echo "🌐 Starting Laravel server..."
php artisan serve --host=0.0.0.0 --port=$PORT
