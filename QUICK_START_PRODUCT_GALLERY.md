# 🚀 Product Gallery - Quick Start Guide

## Overview
This guide will help you quickly set up and use the enhanced product gallery system.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Seed Sample Products
```bash
# Navigate to project root
cd C:\Users\prota\thesis_test1

# Run the product seeder
php backend/seed_products.php
```

**Expected Output:**
```
Seeding sample products...
✅ Products seeded successfully!
You can now view the products in the product gallery.
```

This creates 15 sample products across 4 categories.

---

### Step 2: Start the Servers

```bash
# Terminal 1 - Backend API
cd backend
php artisan serve --port=8000

# Terminal 2 - Frontend Dev Server
cd frontend--
npm run dev
```

**Servers:**
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173

---

### Step 3: Test the System

Open the test page in your browser:
```
file:///C:/Users/prota/thesis_test1/test_product_gallery_comprehensive.html
```

**Test Sequence:**
1. Click "👑 Admin (Full Access)"
2. Click "📋 Get All Products" → Should show 15 products
3. Click "➕ Create Product" → Should succeed
4. Click "👤 Customer (Read Only)"
5. Click "➕ Create Product" → Should fail (403 Forbidden)

✅ If all tests pass, your system is working correctly!

---

## 🎯 Using in Your Application

### For Admin/Staff - Product Management

#### View Products
```tsx
import { MultiBranchProductGallery } from '@/features/products/components/MultiBranchProductGallery';

function AdminProductPage() {
  return <MultiBranchProductGallery />;
}
```

#### Create/Edit Product
```tsx
import { ProductForm } from '@/features/products/components/ProductForm';
import { createProduct, updateProduct, getProductCategories } from '@/services/productApi';
import { useState, useEffect } from 'react';

function ProductManagement() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const cats = await getProductCategories();
    setCategories(cats);
  }

  async function handleSubmit(data) {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setShowForm(false);
    // Refresh product list
  }

  return (
    <div>
      <button onClick={() => setShowForm(true)}>Add Product</button>
      
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

---

### For Customers - Browse Products

```tsx
import { MultiBranchProductGallery } from '@/features/products/components/MultiBranchProductGallery';

function CustomerProductPage() {
  // Gallery automatically shows only approved products
  // and hides admin controls for customers
  return (
    <div>
      <h1>Our Products</h1>
      <MultiBranchProductGallery />
    </div>
  );
}
```

---

## 📝 API Usage Examples

### Get All Products
```typescript
import { getProducts } from '@/services/productApi';

// Get all products
const products = await getProducts();

// Search products
const searchResults = await getProducts('sunglasses');

// Filter by category
const eyeglasses = await getProducts('', 1); // category_id = 1

// Active products only
const activeProducts = await getProducts('', undefined, true);
```

### Get Single Product
```typescript
import { getProduct } from '@/services/productApi';

const product = await getProduct(1);
console.log(product.name); // "Classic Rectangle Frame"
```

### Create Product
```typescript
import { createProduct } from '@/services/productApi';

const newProduct = await createProduct({
  name: "New Sunglasses",
  description: "Stylish sunglasses with UV protection",
  price: 2500,
  stock_quantity: 20,
  category_id: 2,
  brand: "CoolShades",
  model: "CS-100",
  sku: "CS-100-BLK",
  is_active: true,
  images: [file1, file2], // File objects from input
});
```

### Update Product
```typescript
import { updateProduct } from '@/services/productApi';

const updated = await updateProduct(1, {
  name: "Updated Product Name",
  description: "New description",
  price: 3000,
  stock_quantity: 15,
  // ... other fields
});
```

### Delete Product (Soft Delete)
```typescript
import { deleteProduct } from '@/services/productApi';

await deleteProduct(1);
// Product is soft-deleted, can be restored by admin
```

---

## 🔑 Role-Based Access

| Role | View Products | Create | Edit | Delete |
|------|--------------|--------|------|--------|
| Admin | ✅ All | ✅ | ✅ | ✅ |
| Staff | ✅ All | ✅ | ✅ | ✅ |
| Optometrist | ✅ Approved only | ❌ | ❌ | ❌ |
| Customer | ✅ Approved only | ❌ | ❌ | ❌ |

---

## 📦 Sample Product Categories

The seeder creates these categories:

1. **Eyeglasses** 👓
   - Classic Rectangle Frame
   - Round Vintage Glasses
   - Cat Eye Fashion Frame
   - Aviator Metal Frame

2. **Sunglasses** 🕶️
   - Polarized Sports Sunglasses
   - Classic Wayfarer Sunglasses
   - Oversized Fashion Sunglasses

3. **Contact Lenses** 👁️
   - Daily Disposable Contact Lenses
   - Monthly Contact Lenses
   - Colored Contact Lenses

4. **Accessories** 🧴
   - Hard Shell Glasses Case
   - Lens Cleaning Solution
   - Microfiber Cleaning Cloth Set
   - Anti-Slip Eyeglass Strap

---

## 🛠️ Troubleshooting

### Products Not Showing?
1. Make sure seeder ran successfully: `php backend/seed_products.php`
2. Check backend is running: http://localhost:8000/api/products
3. Verify authentication token is set in sessionStorage

### Images Not Loading?
1. Check `getStorageUrl()` is used for image paths
2. Verify storage is linked: `php backend/artisan storage:link`
3. Check backend storage folder has proper permissions

### Can't Create Products?
1. Verify you're logged in as Admin or Staff
2. Check authentication token is valid
3. Verify all required fields are filled (name, description, price, stock_quantity)

### Upload Fails?
1. Check file size (max 5MB per image)
2. Verify file type (JPG, PNG, GIF, WebP only)
3. Check backend upload limits in php.ini

---

## 📚 Additional Resources

- **Full Documentation**: `PRODUCT_GALLERY_ENHANCEMENTS_COMPLETE.md`
- **Type Definitions**: `frontend--/src/features/products/types/product.types.ts`
- **API Service**: `frontend--/src/services/productApi.ts`
- **Form Component**: `frontend--/src/features/products/components/ProductForm.tsx`
- **Test Suite**: `test_product_gallery_comprehensive.html`

---

## 🎉 You're Ready!

The product gallery is now fully functional with:
- ✅ 15 sample products
- ✅ Role-based access control
- ✅ Image upload and display
- ✅ Complete CRUD operations
- ✅ Search and filter
- ✅ Multi-branch support

Start building your optical store! 🚀

**Need Help?** Check the test page or full documentation.



