#!/bin/bash

echo "🚀 Starting Everbright Optical System..."

# Create necessary directories and set permissions
echo "📁 Creating directories and setting permissions..."
mkdir -p backend/storage/framework/cache
mkdir -p backend/storage/framework/sessions
mkdir -p backend/storage/framework/views
mkdir -p backend/storage/logs
mkdir -p backend/bootstrap/cache

# Set proper permissions
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache

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
