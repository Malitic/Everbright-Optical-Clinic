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

# Build frontend with error handling
echo "📦 Building frontend..."
echo "📋 Current directory: $(pwd)"
echo "📋 Contents:"
ls -la

# Check if frontend directory exists
if [ ! -d "frontend--" ]; then
    echo "❌ Frontend directory not found!"
    echo "📋 Available directories:"
    ls -la
    echo "⚠️ Skipping frontend build - will serve API only"
else
    cd frontend--
    echo "📋 Inside frontend directory: $(pwd)"
    echo "📋 Frontend contents:"
    ls -la

    # Try to install dependencies
    echo "📋 Installing frontend dependencies..."
    if npm install; then
        echo "✅ Dependencies installed successfully"
        
        # Try to build
        echo "🔨 Building frontend..."
        if npm run build; then
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
        else
            echo "❌ Frontend build failed"
            echo "📋 Contents after failed build:"
            ls -la
        fi
    else
        echo "❌ Frontend dependency installation failed"
        echo "📋 Contents after failed install:"
        ls -la
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
