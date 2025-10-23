#!/bin/bash

# Railway Deployment Script for Everbright Optical System

echo "🚀 Starting Railway deployment..."

# Check if we're in the right directory
if [ ! -f "backend/artisan" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install Railway CLI if not present
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Initialize Railway project
echo "🏗️ Initializing Railway project..."
railway init

# Set environment variables
echo "⚙️ Setting up environment variables..."
railway variables set APP_NAME="Everbright Optical System"
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false

# Generate application key
echo "🔑 Generating application key..."
cd backend
php artisan key:generate --show
cd ..

echo "📝 Please copy the generated APP_KEY and set it in Railway dashboard"
echo "📝 Also set the following variables in Railway:"
echo "   - DB_HOST (from MySQL service)"
echo "   - DB_DATABASE (from MySQL service)"
echo "   - DB_USERNAME (from MySQL service)"
echo "   - DB_PASSWORD (from MySQL service)"
echo "   - REDIS_HOST (from Redis service)"
echo "   - REDIS_PASSWORD (from Redis service)"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app will be available at: https://your-app.railway.app"
