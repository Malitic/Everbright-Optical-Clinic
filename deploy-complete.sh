#!/bin/bash

# 🚀 Complete Railway Deployment Script for Everbright Optical System
# This script deploys both backend and frontend to Railway

set -e  # Exit on any error

echo "🚀 Starting complete Railway deployment for Everbright Optical System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/artisan" ] || [ ! -f "frontend--/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_status "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
print_status "Logging into Railway..."
railway login

# Create Railway project
print_status "Creating Railway project..."
railway init

# Deploy backend
print_status "Deploying backend to Railway..."
cd backend
railway up --detach
BACKEND_URL=$(railway domain)
print_success "Backend deployed at: $BACKEND_URL"
cd ..

# Deploy frontend
print_status "Deploying frontend to Railway..."
cd frontend--
railway up --detach
FRONTEND_URL=$(railway domain)
print_success "Frontend deployed at: $FRONTEND_URL"
cd ..

# Set up environment variables
print_status "Setting up environment variables..."

# Backend environment variables
railway variables set APP_NAME="Everbright Optical System"
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false
railway variables set APP_URL=$BACKEND_URL

# Generate and set application key
print_status "Generating application key..."
cd backend
APP_KEY=$(php artisan key:generate --show)
railway variables set APP_KEY=$APP_KEY
cd ..

# Database setup
print_status "Setting up MySQL database..."
railway add mysql
print_warning "Please set the following database variables in Railway dashboard:"
print_warning "- DB_HOST (from MySQL service)"
print_warning "- DB_DATABASE (from MySQL service)"
print_warning "- DB_USERNAME (from MySQL service)"
print_warning "- DB_PASSWORD (from MySQL service)"

# Redis setup
print_status "Setting up Redis cache..."
railway add redis
print_warning "Please set the following Redis variables in Railway dashboard:"
print_warning "- REDIS_HOST (from Redis service)"
print_warning "- REDIS_PASSWORD (from Redis service)"

# CORS setup
print_status "Setting up CORS configuration..."
railway variables set CORS_ALLOWED_ORIGINS=$FRONTEND_URL

# Frontend environment variables
print_status "Setting up frontend environment variables..."
cd frontend--
railway variables set VITE_API_URL=$BACKEND_URL/api
cd ..

# Run database migrations
print_status "Running database migrations..."
cd backend
railway run php artisan migrate --force
print_success "Database migrations completed"
cd ..

# Build frontend
print_status "Building frontend..."
cd frontend--
npm run build
print_success "Frontend build completed"
cd ..

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Backend URL: $BACKEND_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  API Endpoint: $BACKEND_URL/api"
echo ""
echo "📝 Next Steps:"
echo "  1. Set database variables in Railway dashboard"
echo "  2. Set Redis variables in Railway dashboard"
echo "  3. Test your application"
echo "  4. Set up custom domains (optional)"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"
echo "📚 Documentation: https://docs.railway.app"
echo ""
print_success "Your Everbright Optical System is now live on Railway! 🚀"
