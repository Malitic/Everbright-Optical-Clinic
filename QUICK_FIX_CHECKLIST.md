# 🔍 Unitop Low Stock Items Not Showing - Troubleshooting

## ⚠️ If you still don't see the items, follow these steps:

### Step 1: Restart Frontend Dev Server

The changes I made need to be loaded by the dev server.

```bash
# Stop the frontend server (Ctrl+C if running)
# Then restart:
cd frontend--
npm run dev
```

**Wait for:** `Local: http://localhost:5173/`

---

### Step 2: Hard Refresh Browser

The browser might be caching the old component.

**Windows/Linux:** `Ctrl + Shift + R`  
**Mac:** `Cmd + Shift + R`

OR:
1. Open Browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

### Step 3: Clear Browser Cache & SessionStorage

```javascript
// Open browser console (F12) and run:
sessionStorage.clear();
location.reload();
```

---

### Step 4: Login Fresh and Check

1. **Logout** from admin account
2. **Login again:**
   - Email: `admin@everbright.com`
   - Password: `password123`
3. **Navigate to:** `/admin/inventory`

---

### Step 5: Verify Data is Loading

**Open Browser Console (F12) and look for:**

```
AdminCentralInventory: Loading with filters: {searchTerm: "", statusFilter: "all", branchFilter: "all", ...}
AdminCentralInventory: Loaded X items
AdminCentralInventory: Unitop items: X
```

**If you see:** `Unitop items: 8` - The data IS loading!

---

### Step 6: Check Filter Settings

Look at the filter dropdowns on the page:

**Branch Filter:**
- Should be set to **"All Branches"** (to see all)
- OR set to **"Unitop Branch"** (to see only Unitop)

**Status Filter:**
- Set to **"All"** (to see all items)
- OR set to **"Low Stock"** (to see only low stock)

**Screenshot of what to look for:**
```
┌─────────────────────────────────────┐
│ Branch: [All Branches ▼]           │
│ Status: [All           ▼]           │
└─────────────────────────────────────┘
```

---

### Step 7: Manual API Test

Let's verify the backend is returning data:

```bash
# Open PowerShell in backend folder
cd C:\Users\prota\thesis_test1

# Test the endpoint
curl http://localhost:8000/api/test-unitop-inventory
```

**Expected Response:**
```json
{
  "total_items": 8,
  "low_stock_count": 2,
  "items": [...]
}
```

**If this fails:** Backend server isn't running!

```bash
cd backend
php artisan serve
```

---

### Step 8: Check What Page You're On

Make sure you're on the RIGHT admin inventory page:

**✅ CORRECT URL:**
```
http://localhost:5173/admin/inventory
```

**❌ WRONG URLs:**
```
http://localhost:5173/admin/products  (This is Product Gallery)
http://localhost:5173/admin/inventory/consolidated
http://localhost:5173/admin/stock-management
```

---

### Step 9: Look at the Actual Display

When you're on `/admin/inventory`, you should see:

**Inventory Table with columns:**
- Product Name
- SKU
- Branch
- Quantity
- Status
- Actions

**For Unitop, you should see 8 rows:**
```
Glass 7  | GLF-007 | Unitop | 3  | ⚠️ Low Stock  | [Actions]
Glass 7  | GLF-007 | Unitop | 5  | ⚠️ Low Stock  | [Actions]
Glass 1  | GLF-001 | Unitop | 25 | ✓ In Stock    | [Actions]
Glass 2  | GLF-002 | Unitop | 25 | ✓ In Stock    | [Actions]
Glass 3  | GLF-003 | Unitop | 25 | ✓ In Stock    | [Actions]
Glass 4  | GLF-004 | Unitop | 25 | ✓ In Stock    | [Actions]
Glass 5  | GLF-005 | Unitop | 24 | ✓ In Stock    | [Actions]
Glass 6  | GLF-006 | Unitop | 24 | ✓ In Stock    | [Actions]
```

---

### Step 10: Screenshot What You See

If you still don't see the items, please check:

1. **What URL are you on?** (copy from address bar)
2. **What do you see on screen?** (take screenshot)
3. **What's in the browser console?** (F12, check for errors)
4. **What are your filter settings?**

---

## 🎯 Most Common Issues:

### Issue 1: Dev Server Not Restarted
**Solution:** Stop and restart `npm run dev`

### Issue 2: Browser Cache
**Solution:** Hard refresh with `Ctrl+Shift+R`

### Issue 3: Wrong Page
**Solution:** Make sure you're on `/admin/inventory` NOT `/admin/products`

### Issue 4: Filters Set Wrong
**Solution:** Set Branch to "All Branches" and Status to "All"

### Issue 5: Backend Not Running
**Solution:** Start backend with `php artisan serve`

### Issue 6: Looking at Product Gallery Instead
**Solution:** 
- Product Gallery = `/admin/products` (different page)
- Inventory = `/admin/inventory` (correct page)

---

## 📋 Quick Verification Commands:

```bash
# Check if backend is running
curl http://localhost:8000/api/test-unitop-inventory

# Check if frontend is running  
curl http://localhost:5173

# Restart frontend
cd frontend--
npm run dev

# Restart backend
cd backend
php artisan serve
```

---

## 🚨 If STILL Not Working:

Please provide:
1. Screenshot of `/admin/inventory` page
2. Screenshot of browser console (F12)
3. URL in address bar
4. Filter settings you have selected

