# Local Development Setup Guide

This project has been configured for local development only. No deployment configurations are included.

## Prerequisites

- PHP 8.1+ with MySQL extensions (pdo_mysql, mysqli)
- MySQL Server 8.0+
- Composer
- Node.js 18+
- npm or yarn

## Database Setup (MySQL)

1. Install MySQL Server:
   - **Windows:** Download from https://dev.mysql.com/downloads/mysql/
   - **macOS:** `brew install mysql && brew services start mysql`
   - **Linux:** `sudo apt install mysql-server`

2. Create database:
   ```sql
   mysql -u root -p
   CREATE DATABASE everbright_optical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

## Backend Setup (Laravel)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` file with MySQL configuration:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=everbright_optical
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   ```

5. Generate application key:
   ```bash
   php artisan key:generate
   ```

6. Run database migrations:
   ```bash
   php artisan migrate
   ```

7. Start the development server:
   ```bash
   php artisan serve
   ```
   
   The backend will be available at: http://localhost:8000

## Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend--
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will be available at: http://localhost:5173

## Database

The application uses MySQL for local development. The database configuration:
- **Host:** 127.0.0.1
- **Port:** 3306
- **Database:** everbright_optical
- **Connection:** MySQL via Laravel's Eloquent ORM

## Environment Configuration

### Backend (.env)
- `APP_URL=http://localhost:8000`
- `DB_CONNECTION=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=everbright_optical`
- `DB_USERNAME=root`
- `DB_PASSWORD=your_mysql_password`

### Frontend
Update API endpoints in `src/config/api.ts` to point to `http://localhost:8000`

## Development Commands

### Backend
- `php artisan serve` - Start development server
- `php artisan migrate` - Run database migrations
- `php artisan migrate:fresh --seed` - Reset database with sample data

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

✅ **Backend:** Laravel (PHP 8.x)  
✅ **Database:** MySQL 8.0+  
✅ **API:** RESTful API with Laravel  
✅ **Frontend:** React + Vite  
✅ **Development Server:** `php artisan serve` (Backend) + `npm run dev` (Frontend)

## Notes

- All deployment-related files have been removed
- The system is configured for local development only
- MySQL is used as the database system
- No external hosting or deployment configurations are included
