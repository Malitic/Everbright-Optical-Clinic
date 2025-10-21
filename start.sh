#!/bin/bash

echo "🚀 Starting Everbright Optical System (Full Stack with Pre-built Frontend)..."

# Set environment variables for sessions
export SESSION_DRIVER=database
export CACHE_DRIVER=database

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

# Check if pre-built frontend exists
echo "📦 Checking for pre-built frontend..."
echo "📋 Current directory: $(pwd)"
echo "📋 Contents:"
ls -la

if [ -d "frontend--/dist" ] && [ -f "frontend--/dist/index.html" ]; then
    echo "✅ Pre-built frontend found!"
    echo "📁 Frontend build contents:"
    ls -la frontend--/dist/
    echo "✅ Using pre-built frontend - no build needed"
else
    echo "⚠️ Pre-built frontend not found"
    echo "📋 Available directories:"
    ls -la
    echo "⚠️ Will serve backend API only"
fi

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
