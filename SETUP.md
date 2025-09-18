# Product Gallery Setup Guide

## Backend Setup (Laravel)

1. **Create Product Model and Migration**
```bash
php artisan make:model Product -m
```

2. **Create Product Controller**
```bash
php artisan make:controller ProductController --api
```

3. **Run Migrations**
```bash
php artisan migrate
```

4. **Create Storage Link**
```bash
php artisan storage:link
```

5. **Configure CORS**
Add to `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:5173'],
```

## Frontend Setup

1. **Install Required Dependencies**
```bash
npm install react-hook-form @hookform/resolvers zod
```

2. **Set Environment Variables**
Create `.env` file in frontend:
```
VITE_API_URL=http://localhost:8000/api
```

3. **Update Product Types**
Replace the existing product.types.ts with the new structure.

## Usage

### For Customers/Optometrists
- View product gallery
- Search and sort products
- View product details

### For Admin/Staff
- All customer features plus:
- Add new products
- Edit existing products
- Delete products
- Upload product images

## Testing

1. **Backend Testing**
```bash
php artisan test
```

2. **Frontend Testing**
```bash
npm run dev
```

## Features Implemented
✅ Responsive product gallery
✅ Role-based access control
✅ Image upload with preview
✅ Search and sort functionality
✅ Form validation
✅ Loading and error states
✅ CRUD operations
✅ Responsive design with TailwindCSS
