# Debug Guide: Low Stock Filter Issue

## Problem
When clicking the status dropdown to select "Low Stock", the filtered results appear for only 1 second and then disappear.

## Debugging Steps

### 1. Open Browser Console
Press `F12` or `Ctrl+Shift+I` to open Developer Tools, then click the "Console" tab.

### 2. Test the Filter
1. Navigate to **Staff → Inventory Management**
2. Open the browser console (F12)
3. Click the **Status** dropdown
4. Select **"Low Stock"**
5. Watch the console output

### Expected Console Output:
```javascript
Filtering inventory: {
  totalItems: 10,           // Total items in inventory
  statusFilter: "low_stock", // Should show "low_stock"
  searchTerm: "",
  uniqueStatuses: ["in_stock", "low_stock", "out_of_stock"] // All statuses in data
}

Filtered results: 3 items with status filter: low_stock
```

### 3. What to Look For

#### ✅ Good Signs:
- `statusFilter` shows `"low_stock"` 
- `uniqueStatuses` array includes `"low_stock"`
- `Filtered results` shows a number > 0
- The filter stays as `"low_stock"` and doesn't change back to `"all"`

#### ❌ Problem Signs:

**Problem 1: Status mismatch**
```javascript
uniqueStatuses: ["In Stock", "Low Stock", "Out of Stock"] // Wrong format! Should be lowercase with underscores
```
**Solution:** Backend is returning wrong status format. Already fixed in the code with normalization.

**Problem 2: Filter keeps resetting**
```javascript
// First log:
statusFilter: "low_stock"
Filtered results: 3 items

// 1 second later:
statusFilter: "all"  // ← Filter reset!
Filtered results: 10 items
```
**Solution:** Something is resetting the statusFilter state. This is the likely cause.

**Problem 3: No low stock items**
```javascript
statusFilter: "low_stock"
Filtered results: 0 items  // No items match
```
**Solution:** There actually aren't any low stock items in your inventory.

### 4. Check for State Resets

If you see the filter resetting to "all", check for:

1. **Auto-refresh interference**
   - The inventory auto-refreshes every 30 seconds
   - This should NOT reset the filter
   - If it does, there's a bug

2. **Dropdown value resetting**
   - Check if the dropdown value visually stays on "Low Stock"
   - Or if it jumps back to "All Status"

3. **Component re-mounting**
   - If the entire component re-renders, state might reset

### 5. Test Without Auto-Refresh

To test if auto-refresh is causing the issue:

1. Find this line in the code (around line 139):
```javascript
const interval = setInterval(loadInventory, 30000);
```

2. Temporarily change `30000` to `300000` (5 minutes instead of 30 seconds)

3. Test the filter again

4. If it works now, the auto-refresh was interfering

---

## Current Fix Applied

I've updated the filtering logic to normalize status values:

```javascript
// Old code (strict comparison):
const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

// New code (normalized comparison):
const itemStatus = item.status?.toLowerCase().replace(/\s+/g, '_');
const filterStatus = statusFilter.toLowerCase().replace(/\s+/g, '_');
const matchesStatus = statusFilter === 'all' || itemStatus === filterStatus;
```

This handles both formats:
- Backend sends: `"low_stock"` (lowercase, underscore)
- If it accidentally sends: `"Low Stock"` (capitalized, space) → Normalized to `"low_stock"`

---

## Manual Test

### Test 1: Check if you have low stock items

1. Go to Staff Inventory
2. Look at the summary cards at the top
3. Check the **"Low Stock"** card
4. Does it show a number > 0?

**If it shows 0:** You don't have any low stock items. Add one:
- Click "Add Product"
- Set Quantity: `3`
- Set Min Threshold: `10`
- Save
- Now the item should be low stock (3 < 10)

### Test 2: Filter manually in console

1. Open browser console
2. Type this:
```javascript
// Check what statuses are in your data
console.log(document.querySelector('select#status').value);
```

3. Change the dropdown to "Low Stock"

4. Type this again:
```javascript
console.log(document.querySelector('select#status').value);
```

5. Should show `"low_stock"`

6. If it shows something different or changes back, there's a dropdown issue

---

## Common Causes & Solutions

### Cause 1: Backend Status Format Mismatch
**Symptoms:** Console shows statuses like `"Low Stock"` instead of `"low_stock"`

**Fix:** ✅ Already applied in backend code. Status is normalized on line 106 of `EnhancedInventoryController.php`

### Cause 2: Filter State Being Reset
**Symptoms:** Filter value changes back to "all" automatically

**Fix:** Check for:
- Forms auto-submitting
- Parent component re-rendering
- State management conflicts

**Code to check:**
```javascript
// Line 80 in UnifiedStaffInventory.tsx
const [statusFilter, setStatusFilter] = useState('all');

// Line 453
onChange={(e) => setStatusFilter(e.target.value)}
```

Make sure nothing else is calling `setStatusFilter` or `setStatusFilter('all')`

### Cause 3: React Key Issues
**Symptoms:** Component re-mounts when filter changes

**Fix:** Check if parent component has stable keys

### Cause 4: No Low Stock Items Actually Exist
**Symptoms:** Filtered results: 0 items

**Fix:** Add low stock items for testing

---

## Next Steps

1. ✅ Open browser console
2. ✅ Test the filter
3. ✅ Check console output
4. ✅ Report what you see in the console

**Share this information:**
- What does `statusFilter` show?
- What does `uniqueStatuses` show?
- What does `Filtered results` show?
- Does the dropdown value stay on "Low Stock" or jump back?
- Does the filter work if you wait 1-2 minutes?

This will help identify the exact cause!

