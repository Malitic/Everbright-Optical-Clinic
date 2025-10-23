# MySQL Database Setup Guide

This project uses MySQL as the database system. Follow these steps to set up your local MySQL database.

## Prerequisites

- MySQL Server 8.0+ installed locally
- PHP with MySQL extensions (pdo_mysql, mysqli)
- Composer

## MySQL Setup

### 1. Install MySQL

**Windows:**
- Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
- Install MySQL Server and MySQL Workbench (optional GUI)

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Create Database

Connect to MySQL and create the database:

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create the database
CREATE DATABASE everbright_optical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (optional but recommended)
CREATE USER 'everbright_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON everbright_optical.* TO 'everbright_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Backend Environment Configuration

Create a `.env` file in the `backend` directory with MySQL configuration:

```env
APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost:8000

# MySQL Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=everbright_optical
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# Session Configuration
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false

# Cache Configuration
CACHE_STORE=database

# Queue Configuration
QUEUE_CONNECTION=database

# Mail Configuration (for local development)
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

VITE_APP_NAME="${APP_NAME}"
```

### 4. Backend Setup Commands

```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# Seed the database (optional)
php artisan db:seed

# Start the development server
php artisan serve
```

### 5. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend--

# Install dependencies
npm install

# Start development server
php artisan serve
```

## Database Management

### Using MySQL Workbench (GUI)
- Connect to your local MySQL server
- Use the `everbright_optical` database
- Manage tables, data, and queries visually

### Using Command Line
```bash
# Connect to MySQL
mysql -u root -p

# Use the database
USE everbright_optical;

# View tables
SHOW TABLES;

# View table structure
DESCRIBE table_name;
```

### Laravel Artisan Commands
```bash
# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Fresh migration with seeding
php artisan migrate:fresh --seed

# Create a new migration
php artisan make:migration create_table_name

# Create a new model
php artisan make:model ModelName
```

## Troubleshooting

### Common Issues:

1. **Connection Refused:**
   - Ensure MySQL service is running
   - Check if port 3306 is available
   - Verify MySQL credentials

2. **Database Not Found:**
   - Create the database manually
   - Check database name in `.env` file

3. **Permission Denied:**
   - Grant proper permissions to MySQL user
   - Use root user for initial setup

4. **Migration Errors:**
   - Check MySQL version compatibility
   - Ensure all required PHP extensions are installed

## Tech Stack Summary

✅ **Backend:** Laravel (PHP 8.x)  
✅ **Database:** MySQL 8.0+  
✅ **API:** RESTful API with Laravel  
✅ **Frontend:** React + Vite  
✅ **Development Server:** `php artisan serve` (Backend) + `npm run dev` (Frontend)
