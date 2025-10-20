#!/bin/bash
# Railway Deployment Script for Everbright Optical System
# This script helps prepare and deploy both backend and frontend to Railway

set -e

echo "🚀 Everbright Optical System - Railway Deployment Script"
echo "=================================================="

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
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend--" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment preparation..."

# Step 1: Prepare Backend
print_status "Preparing backend for deployment..."

cd backend

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    print_warning "Composer not found. Please install Composer first."
    print_status "Visit: https://getcomposer.org/download/"
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
composer install --no-dev --optimize-autoloader

# Generate application key if not exists
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "APP_NAME=Everbright Optical System
APP_ENV=production
APP_DEBUG=false
APP_KEY=
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync" > .env
fi

# Generate app key
print_status "Generating application key..."
php artisan key:generate --force

# Run migrations
print_status "Running database migrations..."
php artisan migrate --force

# Clear caches
print_status "Clearing application caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

cd ..

print_success "Backend preparation completed!"

# Step 2: Prepare Frontend
print_status "Preparing frontend for deployment..."

cd frontend--

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_warning "npm not found. Please install Node.js and npm first."
    print_status "Visit: https://nodejs.org/"
    exit 1
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install --force

# Build frontend
print_status "Building frontend for production..."
npm run build

cd ..

print_success "Frontend preparation completed!"

# Step 3: Create deployment package
print_status "Creating deployment package..."

# Create a temporary directory for deployment
DEPLOY_DIR="railway-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy backend files
print_status "Copying backend files..."
cp -r backend "$DEPLOY_DIR/"

# Copy frontend files
print_status "Copying frontend files..."
cp -r frontend-- "$DEPLOY_DIR/"

# Copy root configuration files
print_status "Copying configuration files..."
cp railway.json "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp composer.json "$DEPLOY_DIR/"
cp Procfile "$DEPLOY_DIR/" 2>/dev/null || true

# Create README for deployment
cat > "$DEPLOY_DIR/README-DEPLOYMENT.md" << EOF
# Railway Deployment Package

This package contains both backend and frontend ready for Railway deployment.

## Backend Deployment
1. Create new Railway project
2. Set root directory to: backend
3. Deploy

## Frontend Deployment  
1. Create new Railway project
2. Set root directory to: . (root)
3. Deploy

## Environment Variables

### Backend Variables:
- APP_NAME=Everbright Optical System
- APP_ENV=production
- APP_DEBUG=false
- DB_CONNECTION=sqlite
- DB_DATABASE=/app/database/database.sqlite

### Frontend Variables:
- VITE_API_URL=https://your-backend-url.railway.app/api
- NODE_ENV=production

## URLs After Deployment
- Backend: https://your-backend-name.railway.app
- Frontend: https://your-frontend-name.railway.app
EOF

print_success "Deployment package created: $DEPLOY_DIR"

# Step 4: Display next steps
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. Go to Railway Dashboard: https://railway.app"
echo ""
echo "2. Deploy Backend:"
echo "   - Create new project"
echo "   - Connect GitHub repo"
echo "   - Set root directory to: backend"
echo "   - Name: everbright-optical-backend"
echo ""
echo "3. Deploy Frontend:"
echo "   - Create new project" 
echo "   - Connect GitHub repo"
echo "   - Set root directory to: . (root)"
echo "   - Name: everbright-optical-frontend"
echo ""
echo "4. Set Environment Variables (see README-DEPLOYMENT.md)"
echo ""
echo "5. Test your deployment:"
echo "   - Backend: https://your-backend-name.railway.app/api/health"
echo "   - Frontend: https://your-frontend-name.railway.app"
echo ""

print_success "Deployment preparation completed!"
print_status "Check the $DEPLOY_DIR directory for deployment files"
print_status "Follow the steps above to deploy to Railway"

# Optional: Open Railway dashboard
if command -v open &> /dev/null; then
    echo ""
    read -p "Would you like to open Railway dashboard? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://railway.app"
    fi
fi

echo ""
print_success "Script completed successfully! 🎉"
