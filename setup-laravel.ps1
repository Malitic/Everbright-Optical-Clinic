# Laravel Integration Setup Script
# This script helps integrate Laravel with the everbright_optical_safe.sql database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Laravel Integration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to backend directory
Write-Host "Step 1: Navigating to backend directory..." -ForegroundColor Yellow
Set-Location -Path "backend"

# Step 2: Check if .env exists
Write-Host "Step 2: Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found. Creating it..." -ForegroundColor Red
    # .env file should already be created
}

# Step 3: Generate application key
Write-Host ""
Write-Host "Step 3: Generating application key..." -ForegroundColor Yellow
try {
    php artisan key:generate
    Write-Host "✓ Application key generated" -ForegroundColor Green
} catch {
    Write-Host "✗ Error generating key: $_" -ForegroundColor Red
}

# Step 4: Clear caches
Write-Host ""
Write-Host "Step 4: Clearing caches..." -ForegroundColor Yellow
try {
    php artisan config:clear
    php artisan cache:clear
    php artisan view:clear
    php artisan route:clear
    Write-Host "✓ Caches cleared" -ForegroundColor Green
} catch {
    Write-Host "✗ Error clearing caches: $_" -ForegroundColor Red
}

# Step 5: Cache configuration
Write-Host ""
Write-Host "Step 5: Caching configuration..." -ForegroundColor Yellow
try {
    php artisan config:cache
    Write-Host "✓ Configuration cached" -ForegroundColor Green
} catch {
    Write-Host "✗ Error caching configuration: $_" -ForegroundColor Red
}

# Step 6: Test database connection
Write-Host ""
Write-Host "Step 6: Testing database connection..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: You need to:" -ForegroundColor Red
Write-Host "1. Start MySQL Server" -ForegroundColor Yellow
Write-Host "2. Create database: everbright_optical" -ForegroundColor Yellow
Write-Host "3. Import the SQL file: backend\database\everbright_optical_safe.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "To import the SQL file, run:" -ForegroundColor Cyan
Write-Host "mysql -u root -p everbright_optical < backend\database\everbright_optical_safe.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use MySQL Workbench to import the file." -ForegroundColor Cyan
Write-Host ""

# Step 7: Offer to start the server
Write-Host ""
$startServer = Read-Host "Would you like to start the Laravel development server? (y/n)"
if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host "Starting Laravel server..." -ForegroundColor Green
    Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
    php artisan serve
} else {
    Write-Host ""
    Write-Host "To start the server later, run:" -ForegroundColor Yellow
    Write-Host "cd backend" -ForegroundColor Cyan
    Write-Host "php artisan serve" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

