# Laravel Integration Setup Instructions

This guide will help you re-integrate Laravel framework with the `everbright_optical_safe.sql` database.

## Prerequisites

- MySQL Server installed
- PHP 8.1+ with required extensions
- Composer installed

## Step-by-Step Setup

### Step 1: Start MySQL Server

First, ensure MySQL Server is running on your system.

**Windows:**
- Check if MySQL is installed in `C:\Program Files\MySQL\MySQL Server X.X\`
- Start MySQL service from Services (services.msc) or run:
  ```powershell
  net start MySQL
  ```

### Step 2: Create Database and Import SQL

Open Command Prompt or PowerShell as Administrator and run:

```bash
# Navigate to MySQL bin directory (adjust path as needed)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Or if MySQL is in PATH, use:
mysql -u root -p

# Then in MySQL console, run:
CREATE DATABASE IF NOT EXISTS everbright_optical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Import the SQL file
mysql -u root -p everbright_optical < "C:\Users\admin\Everbright-Optical-Clinic\backend\database\everbright_optical_safe.sql"
```

**OR** use MySQL Workbench:
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Click "Server" > "Data Import"
4. Select "Import from Self-Contained File"
5. Browse to: `C:\Users\admin\Everbright-Optical-Clinic\backend\database\everbright_optical_safe.sql`
6. Select existing database: `everbright_optical`
7. Click "Start Import"

### Step 3: Update Database Password in .env

Edit `backend\.env` and update the `DB_PASSWORD` field if you have a MySQL password:

```env
DB_PASSWORD=your_mysql_password
```

If you don't have a password (root user with no password), leave it empty:
```env
DB_PASSWORD=
```

### Step 4: Run Laravel Setup Commands

```bash
# Navigate to backend directory
cd backend

# Install/Update PHP dependencies
composer install

# Generate application key
php artisan key:generate

# Clear and cache configuration
php artisan config:clear
php artisan config:cache

# Clear all caches
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Test database connection
php artisan tinker
# Then type: DB::connection()->getPdo(); and press Enter
# If successful, type: exit
```

### Step 5: Start the Laravel Server

```bash
php artisan serve
```

The backend will be available at: http://localhost:8000

### Step 6: Verify Setup

1. Check if the database was imported correctly:
   ```bash
   php artisan tinker
   > DB::select("SHOW TABLES");
   > exit
   ```

2. Test API endpoints (optional):
   - Visit: http://localhost:8000/api/test-backend.html
   - Or test with: http://localhost:8000/api/test-mysql.php

## Troubleshooting

### MySQL not found in PATH
Add MySQL to your system PATH:
1. Open "System Properties" > "Environment Variables"
2. Edit "Path" under System variables
3. Add: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
4. Restart your terminal

### Database connection error
- Verify MySQL service is running
- Check username and password in `.env`
- Ensure database `everbright_optical` exists
- Try: `mysql -u root -p` to test connection

### Permission denied errors
- Run Command Prompt/PowerShell as Administrator
- Check MySQL user permissions

## Files Created/Modified

- `backend/.env` - Created with MySQL configuration
- `backend/database/everbright_optical_safe.sql` - Will be imported into MySQL

## Next Steps

After successful setup:
1. Start backend: `cd backend && php artisan serve`
2. Start frontend: `cd frontend-- && npm run dev`
3. Access the application

## Quick Reference Commands

```bash
# Start MySQL
net start MySQL

# Stop MySQL
net stop MySQL

# Check if MySQL is running
sc query MySQL

# Connect to MySQL
mysql -u root -p

# Test Laravel database connection
cd backend
php artisan tinker
> DB::connection()->getPdo();
> exit
```

## Support

If you encounter issues:
1. Check `backend/storage/logs/laravel.log` for errors
2. Verify all prerequisites are installed
3. Ensure MySQL service is running
4. Check database credentials in `.env` file

