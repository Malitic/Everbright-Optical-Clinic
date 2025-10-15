# Upload Fix - Complete Guide

## ✅ Issues Fixed

### 1. Authentication Issue
**Problem:** Token not found
**Fix:** Changed from `localStorage.getItem('token')` to `sessionStorage.getItem('auth_token')`

### 2. API URL Issue (404 Error)
**Problem:** API calls going to wrong server
- ❌ Was calling: `http://localhost:5173/api/products` (frontend server)
- ✅ Now calling: `http://localhost:8000/api/products` (backend server)

**Fix:** Updated all fetch calls to use proper backend URL:
```typescript
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const response = await fetch(`${apiBaseUrl}/products/create-with-variants`, {
  // ...
});
```

## 🚀 How to Upload Successfully

### Step 1: Verify Backend is Running

**Check backend server:**
```bash
cd backend
php artisan serve
```

**Expected output:**
```
Laravel development server started: http://127.0.0.1:8000
```

**Test backend is accessible:**
Open browser and go to:
```
http://localhost:8000/api/user
```

Should see either:
- JSON response (good!)
- "Unauthenticated" message (also good - backend is running)
- Connection refused (bad - backend not running)

### Step 2: Verify Frontend is Running

**Check frontend server:**
```bash
cd frontend--
npm run dev
```

**Expected output:**
```
VITE ready in XXXms

➜  Local:   http://localhost:5173/
```

### Step 3: Login

1. **Go to login page:**
   ```
   http://localhost:5173/login
   ```

2. **Login as Admin or Staff:**
   - Email: `admin@example.com`
   - Password: (your admin password)
   - Role: Admin

3. **Verify login success:**
   - Opens DevTools (F12)
   - Go to Application tab → Session Storage
   - Should see: `auth_token` with a long string value

### Step 4: Go to Image Analyzer

**Navigate to:**
```
http://localhost:5173/admin/image-analyzer
```

**Should see:**
- Upload area
- "Choose Files" button
- Statistics section
- Empty state message

### Step 5: Upload Images

**Option A: Upload Individual Images**
1. Click "Choose Files"
2. Select 3-6 eyewear images
3. Images appear in upload area

**Option B: Upload ZIP File**
1. Create folder structure:
   ```
   TestProducts/
   ├── Product_Red/
   │   ├── front.jpg
   │   ├── side.jpg
   │   └── top.jpg
   └── Product_Blue/
       ├── front.jpg
       ├── side.jpg
       └── top.jpg
   ```
2. Compress to ZIP
3. Drag & drop ZIP file
4. Wait for extraction

### Step 6: Analyze Images

1. **Click "Analyze Images" button**
2. **Wait for analysis** (progress bar shows 0-100%)
3. **Review results:**
   - Statistics show total images, products, colors
   - Product cards appear
   - Images are grouped by color variants (default mode)

### Step 7: Upload to Gallery

1. **Review products** (edit names, colors if needed)
2. **Click "Upload to Gallery"** (green button)
3. **Watch progress bar**
4. **Wait for success message**

**Expected:**
```
✓ Successfully uploaded 1 product to gallery!
```

### Step 8: Verify Upload

**Check Admin Gallery:**
1. Go to: `http://localhost:5173/admin/products`
2. Product should appear in list
3. Click to view details

**Check Customer Gallery:**
1. Go to: `http://localhost:5173/customer/products`
2. Product should be visible (if approved)
3. Color selector should work

## 🧪 Quick Test

### Minimal Test (2 minutes)

1. **Prepare 2 images:**
   - Download any 2 eyewear images
   - Rename: `TestProduct_front.jpg`, `TestProduct_side.jpg`

2. **Upload:**
   - Go to Image Analyzer
   - Upload both images
   - Click "Analyze Images"

3. **Verify:**
   - Should show 1 product with 2 images
   - Front image should be primary (⭐)

4. **Upload to Gallery:**
   - Click "Upload to Gallery"
   - Should succeed without errors

5. **Check Gallery:**
   - Go to Admin Products
   - Should see "TestProduct" in list

## 🐛 Troubleshooting

### Error: "Please login to upload products"

**Cause:** Not logged in or session expired

**Fix:**
1. Logout
2. Login again as Admin/Staff
3. Check DevTools → Session Storage → `auth_token` exists

### Error: 404 Not Found on /api/products

**Cause:** Backend not running or wrong URL

**Fix:**
1. Verify backend is running: `php artisan serve`
2. Check backend URL: `http://localhost:8000/api/products`
3. Test backend directly in browser

### Error: 401 Unauthorized

**Cause:** Invalid or expired token

**Fix:**
1. Logout and login again
2. Check token is being sent in Authorization header
3. Check backend accepts token

### Error: 403 Forbidden

**Cause:** User doesn't have permission (Customer role)

**Fix:**
1. Login as Admin or Staff
2. Customer role cannot upload products

### Error: 500 Internal Server Error

**Cause:** Backend error

**Fix:**
1. Check backend logs: `storage/logs/laravel.log`
2. Check database is running
3. Check storage permissions:
   ```bash
   cd backend
   chmod -R 775 storage
   php artisan storage:link
   ```

### Upload Starts But Fails Halfway

**Cause:** Some products fail validation

**Fix:**
1. Check error messages in browser console
2. Check backend logs
3. Verify image file sizes (<10MB each)
4. Verify image formats (JPG, PNG, GIF, WEBP)

## ✅ Verification Checklist

**Before Upload:**
- [ ] Backend server running (`http://localhost:8000`)
- [ ] Frontend server running (`http://localhost:5173`)
- [ ] Logged in as Admin or Staff
- [ ] `auth_token` in Session Storage
- [ ] Database running and accessible

**During Upload:**
- [ ] Images upload and analyze successfully
- [ ] Statistics show correct counts
- [ ] Product grouping looks correct
- [ ] Primary images are set (⭐)
- [ ] Colors detected correctly

**After Upload:**
- [ ] "Upload to Gallery" button works
- [ ] No console errors
- [ ] Progress bar reaches 100%
- [ ] Success message appears
- [ ] Products appear in Admin Gallery
- [ ] Products appear in Customer Gallery (if approved)

## 📊 Expected API Calls

When you click "Upload to Gallery", you should see these network requests in DevTools:

### Color Variant Mode

```
Request URL: http://localhost:8000/api/products/create-with-variants
Request Method: POST
Status Code: 201 Created

Headers:
  Authorization: Bearer eyJ0eXAiOiJKV1Qi...
  Content-Type: multipart/form-data

Response:
{
  "message": "Product with color variants created successfully",
  "product": {
    "id": 1,
    "name": "TR90",
    "brand": "TR90",
    "category": "Frames",
    "color_variants": 2,
    "total_images": 6,
    "approval_status": "approved"
  }
}
```

### Angle Grouping Mode

```
Request URL: http://localhost:8000/api/products
Request Method: POST
Status Code: 201 Created

Response:
{
  "message": "Product created successfully",
  "product": { ... }
}
```

### Individual Mode

```
Request URL: http://localhost:8000/api/products
Request Method: POST
Status Code: 201 Created
(Multiple requests, one per image)
```

## 🔧 Backend Requirements

### Required Routes

Make sure these routes exist in `backend/routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    // Color variant upload
    Route::post('products/create-with-variants', [ProductVariantController::class, 'createWithVariants']);
    
    // Standard product upload
    Route::post('products', [ProductController::class, 'store']);
});
```

### Required Controllers

**ProductVariantController:**
- `createWithVariants()` method
- Handles color variants and multiple images

**ProductController:**
- `store()` method
- Handles standard product creation

### Database Requirements

**products table must have:**
- `name`, `brand`, `category_id`
- `price`, `stock_quantity`
- `image_paths` (JSON)
- `primary_image` (string)
- `attributes` (JSON) for color variants
- `approval_status`, `created_by`, `created_by_role`

### Storage Requirements

```bash
# Create storage link
php artisan storage:link

# Set permissions
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/

# Verify storage/app/public/products/ exists
mkdir -p storage/app/public/products
```

## 🎯 Success Criteria

Upload is successful when:

1. ✅ No console errors
2. ✅ No network errors (200/201 responses)
3. ✅ Success toast notification appears
4. ✅ Products visible in Admin Gallery
5. ✅ Products visible in Customer Gallery
6. ✅ Images display correctly
7. ✅ Color variants work (if applicable)
8. ✅ Primary images are correct (front views)

## 📞 Still Having Issues?

### Debug Checklist

Run these commands in browser console:

```javascript
// 1. Check token
console.log('Token:', sessionStorage.getItem('auth_token'));

// 2. Check user
console.log('User:', JSON.parse(sessionStorage.getItem('auth_current_user')));

// 3. Check backend URL
console.log('Backend:', import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

// 4. Test backend
fetch('http://localhost:8000/api/user', {
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(console.log);
```

### Get More Help

**Check logs:**
```bash
# Backend errors
tail -f backend/storage/logs/laravel.log

# Frontend errors
Open DevTools → Console tab

# Network errors
Open DevTools → Network tab
Filter: XHR
Look for failed requests (red)
```

**Test API manually:**
```bash
# Get token from sessionStorage first
TOKEN="your_token_here"

# Test upload endpoint
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Product" \
  -F "brand=Test" \
  -F "category=Frames" \
  -F "color=Black" \
  -F "price=0" \
  -F "stock_quantity=0" \
  -F "images[]=@path/to/image.jpg"
```

## 🎉 Summary

All fixes applied:
- ✅ Authentication fixed (sessionStorage)
- ✅ API URLs fixed (backend server)
- ✅ All upload modes supported
- ✅ Error handling improved
- ✅ Ready for production use

**Try uploading now - it should work!** 🚀

---

**Last Updated:** October 13, 2025  
**Status:** ✅ All Issues Fixed  
**Ready:** Yes - Upload Should Work Now

