#!/bin/bash

echo "🚀 Starting Everbright Optical System (Full Stack)..."

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

# Build frontend with better error handling
echo "📦 Building frontend..."
echo "📋 Current directory: $(pwd)"
echo "📋 Contents:"
ls -la

# Check if frontend directory exists
if [ ! -d "frontend--" ]; then
    echo "❌ Frontend directory not found!"
    echo "📋 Available directories:"
    ls -la
    echo "⚠️ Will serve backend API only"
else
    cd frontend--
    echo "📋 Inside frontend directory: $(pwd)"
    echo "📋 Frontend contents:"
    ls -la

    # Set production environment variables for frontend
    export VITE_API_URL=https://everbright-optical-clinic-system-production.up.railway.app
    export VITE_API_BASE_URL=https://everbright-optical-clinic-system-production.up.railway.app/api
    export VITE_APP_NAME="Everbright Optical System"
    export VITE_APP_ENV=production

    # Try to install dependencies with timeout
    echo "📋 Installing frontend dependencies..."
    timeout 300 npm install || {
        echo "❌ npm install timed out or failed"
        echo "📋 Trying with npm ci..."
        timeout 300 npm ci || {
            echo "❌ npm ci also failed"
            echo "📋 Contents after failed install:"
            ls -la
            cd ..
            echo "⚠️ Frontend build failed - will serve backend API only"
        }
    }

    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
        
        # Try to build with timeout
        echo "🔨 Building frontend..."
        timeout 300 npm run build || {
            echo "❌ Frontend build timed out or failed"
            echo "📋 Contents after failed build:"
            ls -la
            cd ..
            echo "⚠️ Frontend build failed - will serve backend API only"
        }
    fi

    if [ $? -eq 0 ]; then
        echo "✅ Frontend built successfully"
        
        # Check if build was successful
        if [ -d "dist" ] && [ -f "dist/index.html" ]; then
            echo "📁 Frontend build contents:"
            ls -la dist/
            echo "✅ Frontend build completed successfully"
        else
            echo "⚠️ Frontend build completed but dist/index.html not found"
            echo "📋 Contents after build:"
            ls -la
        fi
    fi
    
    # Go back to root
    cd ..
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
