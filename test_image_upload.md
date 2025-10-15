# Quick Test: Image Upload & Display

## ⚡ Step-by-Step Diagnostic

### Step 1: Check If Images Are Being Saved

```bash
cd backend
ls -la storage/app/public/products/
```

**Expected:**
- Should see image files like: `product_1728765432_abc123.jpg`

**If empty:**
- Images aren't being saved
- Try uploading again and check Laravel logs

### Step 2: Check Storage Link

```bash
cd backend
ls -la public/storage
```

**Expected (Linux/Mac):**
```
lrwxrwxrwx 1 user user 20 Oct 13 10:00 storage -> ../storage/app/public
```

**Expected (Windows):**
```
<JUNCTION>  storage [..\storage\app\public]
```

**If missing, create it:**
```bash
php artisan storage:link
```

### Step 3: Test Image URL Directly

1. **Upload a product with one image**

2. **Check the filename in storage:**
   ```bash
   ls storage/app/public/products/
   # Copy the filename, e.g., product_1728765432_abc123.jpg
   ```

3. **Open in browser:**
   ```
   http://localhost:8000/storage/products/product_1728765432_abc123.jpg
   ```

**Expected:**
- Image displays ✅

**If 404:**
- Storage link issue
- File doesn't exist
- Wrong filename

### Step 4: Check Database Paths

```bash
cd backend
php artisan tinker
```

```php
// Get latest product
$product = App\Models\Product::latest()->first();

// Check image paths
print_r($product->image_paths);
// Should show: Array ( [0] => products/product_123.jpg )

// Check primary image
echo $product->primary_image;
// Should show: products/product_123.jpg

// Exit
exit
```

**Expected paths:**
- ✅ `products/product_123.jpg`
- ❌ NOT `public/products/product_123.jpg`
- ❌ NOT `storage/app/public/products/product_123.jpg`

### Step 5: Check Frontend URL Construction

**Open browser DevTools (F12) → Console:**

```javascript
// Check API base URL
console.log(import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

// Test getStorageUrl function (if product has images)
// This should output: http://localhost:8000/storage/products/filename.jpg
```

**Check Network tab:**
- Go to Admin Products page
- Open Network tab
- Filter: Img
- Look for image requests
- Should see: `http://localhost:8000/storage/products/...`
- NOT: `http://localhost:5173/storage/products/...`

### Step 6: Upload Fresh Test

1. **Delete old products (optional):**
   ```sql
   DELETE FROM products WHERE id > 0;
   ```

2. **Go to Image Analyzer:**
   ```
   http://localhost:5173/admin/image-analyzer
   ```

3. **Upload ONE image:**
   - Single eyewear photo
   - Click "Analyze Images"
   - Click "Upload to Gallery"

4. **Check backend logs immediately:**
   ```bash
   tail -50 storage/logs/laravel.log
   ```

5. **Check if file saved:**
   ```bash
   ls -la storage/app/public/products/
   ```

6. **Check Admin Gallery:**
   ```
   http://localhost:5173/admin/products
   ```

## 🔍 Common Problems & Solutions

### Problem: Storage folder empty

**Solution:**
```bash
# Make sure folder exists
mkdir -p storage/app/public/products

# Fix permissions
chmod -R 775 storage/

# Try upload again
```

### Problem: Images on wrong server (5173 instead of 8000)

**Check this file:** `frontend--/src/utils/imageUtils.ts`

Should have:
```typescript
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const baseUrl = apiBaseUrl.replace('/api', '');
return `${baseUrl}/storage/${cleanPath}`;
```

### Problem: Storage link broken

**Windows:**
```bash
# Remove old link
Remove-Item public\storage -Force

# Create new link
php artisan storage:link
```

**Linux/Mac:**
```bash
# Remove old link
rm public/storage

# Create new link
php artisan storage:link
```

### Problem: 404 on direct image URL

**Test:**
```
http://localhost:8000/storage/products/product_123.jpg
```

**If 404, check:**
1. Backend server running on port 8000
2. Storage link exists
3. File actually exists in storage/app/public/products/
4. Filename is correct (case-sensitive!)

## ✅ Success Indicators

Images are working when ALL of these are true:

- [ ] Files exist in `storage/app/public/products/`
- [ ] Storage link exists in `public/storage`
- [ ] Database paths are `products/filename.jpg`
- [ ] Direct URL works: `http://localhost:8000/storage/products/file.jpg`
- [ ] Admin Gallery shows images
- [ ] Customer Gallery shows images
- [ ] No 404 errors in browser console
- [ ] No errors in Laravel logs

## 📋 Quick Reference

### File Locations

```
backend/
├── public/
│   └── storage/ (symlink)
│       └── products/
│           └── [accessed via URL]
│
└── storage/
    └── app/
        └── public/
            └── products/
                └── product_123.jpg (actual file)
```

### URL Mapping

```
File on disk:
  storage/app/public/products/product_123.jpg

Database stores:
  products/product_123.jpg

URL to access:
  http://localhost:8000/storage/products/product_123.jpg

Frontend constructs:
  getStorageUrl("products/product_123.jpg")
  → "http://localhost:8000/storage/products/product_123.jpg"
```

### Commands Cheat Sheet

```bash
# Check images saved
ls -la storage/app/public/products/

# Create storage link
php artisan storage:link

# Fix permissions
chmod -R 775 storage/

# View logs
tail -50 storage/logs/laravel.log

# Check database
php artisan tinker
>>> App\Models\Product::latest()->first()->image_paths

# Test image URL (browser)
http://localhost:8000/storage/products/FILENAME.jpg
```

---

**Start with Step 1 and work through each step!**

