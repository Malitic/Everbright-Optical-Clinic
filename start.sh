#!/bin/bash

echo "🚀 Starting Everbright Optical System..."

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

# Build frontend
echo "📦 Building frontend..."
echo "📋 Current directory: $(pwd)"
echo "📋 Contents:"
ls -la

# Check if frontend directory exists
if [ ! -d "frontend--" ]; then
    echo "❌ Frontend directory not found!"
    echo "📋 Available directories:"
    ls -la
    exit 1
fi

cd frontend--
echo "📋 Inside frontend directory: $(pwd)"
echo "📋 Frontend contents:"
ls -la

echo "📋 Installing frontend dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "✅ Frontend built successfully"

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - dist directory not found"
    echo "📋 Contents after build:"
    ls -la
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Frontend build failed - index.html not found"
    echo "📋 Dist directory contents:"
    ls -la dist/
    exit 1
fi

echo "📁 Frontend build contents:"
ls -la dist/

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
