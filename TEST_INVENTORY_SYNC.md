# Test Guide: Inventory Synchronization Across Systems

## Quick Test Scenarios

### ✅ Test 1: Staff Adds Product to Inventory

**Steps:**
1. Login as **Staff** user
2. Navigate to **Staff → Inventory Management**
3. Click **"Add Product"**
4. Fill in product details:
   - Product Name: "Test Eyewear 001"
   - Brand: "Ray-Ban"
   - Model: "Aviator Classic"
   - Unit Price: 2500
   - Quantity: 50
   - Min Threshold: 10
5. Click **Save**

**Expected Results:**
- ✅ Success message appears
- ✅ Product appears in staff inventory table
- ✅ Stock shows as 50 units

**Verify in Admin (within 30 seconds):**
1. Login as **Admin** user
2. Check **Admin → Product Gallery Management**
   - ✅ Product "Test Eyewear 001" should appear
   - ✅ Total Stock column shows: **50**
   - ✅ Available shows: **50**
   - ✅ Branch Availability shows: **1/X branches**
3. Check **Admin → Central Inventory**
   - ✅ Product appears with **50 units**
   - ✅ Available: **50** (in green)
   - ✅ Status: **In Stock**
   - ✅ Branch badge shows staff's branch
4. Check **Notifications** bell icon
   - ✅ Notification: "Staff [Name] added new inventory item 'Test Eyewear 001' (50 units) at [Branch Name]"

---

### ✅ Test 2: Staff Updates Stock Quantity

**Steps:**
1. Login as **Staff** user
2. Navigate to **Staff → Inventory Management**
3. Find "Test Eyewear 001"
4. Click **Edit** (pencil icon)
5. Change Quantity from 50 to **75**
6. Click **Save Changes**

**Expected Results:**
- ✅ Success message appears
- ✅ Inventory table updates to show 75 units

**Verify in Admin (within 30 seconds):**
1. **Product Gallery Management**:
   - ✅ Total Stock now shows: **75**
   - ✅ Available shows: **75**
2. **Central Inventory**:
   - ✅ Shows **75 units**
   - ✅ Available: **75**
3. **Notifications**:
   - ✅ New notification: "Staff [Name] updated inventory for 'Test Eyewear 001' at [Branch] (from 50 to 75 units)"

---

### ✅ Test 3: Multiple Branches with Same Product

**Scenario:** Two staff members from different branches add the same product

**Steps:**
1. **Staff A** (Branch: Main) adds:
   - Product: "Ray-Ban Wayfarer"
   - Quantity: 30
2. **Staff B** (Branch: Unitop) adds:
   - Product: "Ray-Ban Wayfarer" (same name)
   - Quantity: 45

**Verify in Admin:**
1. **Product Gallery Management**:
   - ✅ Total Stock shows: **75** (30 + 45)
   - ✅ Available shows: **75**
   - ✅ Branch Availability: **2/X branches**
2. Click **Manage Branch Stock** button (building icon):
   - ✅ Main Branch: 30 units
   - ✅ Unitop Branch: 45 units
3. **Central Inventory**:
   - ✅ Shows **two separate entries**:
     - Entry 1: Main Branch - 30 units
     - Entry 2: Unitop Branch - 45 units

---

### ✅ Test 4: Customer Reserves Product

**Steps:**
1. Login as **Customer**
2. Browse products and find "Test Eyewear 001"
3. Add to cart and proceed to checkout
4. Create reservation for **15 units**

**Verify in Admin:**
1. **Product Gallery Management**:
   - ✅ Total Stock: **75** (unchanged)
   - ✅ Available: **60** (75 - 15)
   - ✅ Reserved: **15** (shown in orange)
2. **Central Inventory**:
   - ✅ Stock: **75 units**
   - ✅ Reserved: **15** (in orange)
   - ✅ Available: **60** (in green)

---

### ✅ Test 5: Auto-Refresh Feature

**Steps:**
1. Open **Admin → Product Gallery** in one browser tab
2. Open **Staff → Inventory** in another browser tab (or different browser)
3. In Staff tab: Add a new product "Quick Test Product" with 20 units
4. **Wait 30 seconds** (or less)
5. Check Admin tab (do NOT manually refresh)

**Expected Results:**
- ✅ "Quick Test Product" appears automatically in Admin gallery
- ✅ Total Stock shows: **20**
- ✅ No manual refresh needed

---

### ✅ Test 6: Low Stock Alert

**Steps:**
1. Login as **Staff**
2. Add product with quantity **below** min threshold:
   - Product: "Low Stock Test"
   - Quantity: **3**
   - Min Threshold: **10**

**Verify in Admin:**
1. **Product Gallery Management**:
   - ✅ Product appears with 3 total stock
2. **Central Inventory**:
   - ✅ Product shows **Low Stock** status (yellow badge)
   - ✅ Shows: "Min: 10" threshold
   - ✅ Stock: 3 units

---

### ✅ Test 7: Product Gallery to Inventory Sync

**Steps:**
1. Login as **Admin**
2. Navigate to **Admin → Product Gallery Management**
3. Click **Add Product** button
4. Fill in product details:
   - Name: "Admin Added Product"
   - Price: 1800
   - Stock Quantity: 40
5. Click **Save**

**Verify:**
1. **Product Gallery**:
   - ✅ Product appears immediately
   - ✅ Shows in products list
2. **Central Inventory**:
   - ✅ Product appears with 40 units
   - ✅ Branch shows admin's branch
3. **Manage Branch Stock**:
   - ✅ Click building icon on the product
   - ✅ Shows stock for admin's branch: 40 units
   - ✅ Can update stock for other branches

---

## Visual Indicators Guide

### Stock Display in Product Gallery:
```
Total Stock Column:
📦 125              ← Total stock (bold)
Available: 98       ← Available (gray)
Reserved: 27        ← Reserved (orange, if > 0)

Branch Availability Column:
🏢 3/5 branches     ← X branches have stock / Y total branches
```

### Stock Display in Central Inventory:
```
Product Card:
Product Name  [In Stock] [SKU-001] [Main Branch]

📦 125 units        ← Total stock (bold)
Reserved: 27        ← Reserved (orange)
Available: 98       ← Available (green)
⚠️ Min: 10         ← Threshold
₱2,500             ← Price override (if set)
```

### Status Badges:
- 🟢 **In Stock** (green) - Available quantity > min threshold
- 🟡 **Low Stock** (yellow) - Available quantity > 0 but ≤ min threshold  
- 🔴 **Out of Stock** (red) - Available quantity = 0

---

## Notification Examples

### Staff Adds Inventory:
```
🔔 Staff Inventory Update
Staff Juan Dela Cruz added new inventory item 'Ray-Ban Aviator' (50 units) at Main Branch
2 minutes ago
```

### Staff Updates Inventory:
```
🔔 Staff Inventory Update
Staff Maria Santos updated inventory for 'Oakley Holbrook' at Unitop Branch (from 30 to 45 units)
5 minutes ago
```

### Staff Deletes Inventory:
```
🔔 Staff Inventory Update
Staff Pedro Reyes removed 'Old Product' from inventory at Downtown Branch
10 minutes ago
```

---

## Troubleshooting

### Product not appearing in Admin?
1. **Wait 30 seconds** - Auto-refresh interval
2. **Manually refresh** the page
3. **Check filters** - Make sure "All Status" and "All Branches" selected
4. **Check staff's branch** - Product is assigned to staff's branch
5. **Check API response** - Open browser console (F12) and look for errors

### Stock counts don't match?
1. **Check if multiple branches** - Product Gallery shows TOTAL across all branches
2. **Check reservations** - Available = Stock - Reserved
3. **Click Manage Branch Stock** - See breakdown per branch
4. **Refresh data** - Wait for auto-refresh or manually reload

### Notifications not showing?
1. **Check user role** - Notifications only go to admin users
2. **Check notification bell** - Click bell icon in header
3. **Check if staff made change** - Notifications only for staff actions, not admin actions
4. **Check browser console** - Look for JavaScript errors

### Reserved quantity showing wrong?
1. **Check customer reservations** - Reserved = sum of all customer reservations
2. **Check branch** - Reserved is per branch, not total
3. **Check reservation status** - Only active reservations count (not completed/cancelled)

---

## Expected Data Flow

```
┌─────────────────┐
│  Staff Action   │
│  (Add/Update)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  branch_stocks  │ ◄── Single Source of Truth
│      Table      │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│  Staff View     │ │  Admin View  │ │  Customer    │
│  (Own Branch)   │ │  (All Data)  │ │  (Available) │
└─────────────────┘ └──────────────┘ └──────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
    Auto-refresh     Auto-refresh      Auto-refresh
    (30s interval)   (30s interval)    (Live data)
```

---

## Success Criteria

All systems are working correctly if:

✅ Staff inventory changes appear in Admin Product Gallery (within 30s)
✅ Staff inventory changes appear in Admin Central Inventory (within 30s)
✅ Admin receives notifications for all staff inventory actions
✅ Total stock calculations are correct across multiple branches
✅ Reserved quantities are tracked and displayed correctly
✅ Available quantities = Stock - Reserved (always accurate)
✅ Stock status badges reflect actual stock levels
✅ Branch availability shows correct branch count
✅ Auto-refresh works without manual page reload
✅ Manage Branch Stock shows accurate per-branch breakdown

---

## Quick Commands

### Clear Browser Cache:
```
Ctrl + Shift + Delete (Windows)
Cmd + Shift + Delete (Mac)
```

### Open Developer Console:
```
F12 or Ctrl + Shift + I
```

### Force Refresh Page:
```
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

---

## Support

If issues persist after following this guide:
1. Check `ADMIN_INVENTORY_GALLERY_SYNC_FIX.md` for technical details
2. Review browser console for API errors
3. Check backend logs for database errors
4. Verify database has correct relationships between products, branch_stocks, and branches tables

