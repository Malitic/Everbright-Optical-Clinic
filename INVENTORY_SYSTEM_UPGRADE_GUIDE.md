# Inventory System Upgrade Guide

## Overview

This guide documents the comprehensive upgrade to your inventory management system. The new system provides:

✅ **Branch-Specific Inventory Control** - Staff can add, update, and delete products for their own branch  
✅ **Centralized Admin View** - Admin can see consolidated inventory across all branches  
✅ **Real-Time Synchronization** - Changes made by staff are immediately reflected in admin views  
✅ **Data Consistency** - Automatic synchronization between Products and BranchStock tables  
✅ **Enhanced Permissions** - Staff have full control over their branch inventory

---

## What's New

### Backend Improvements

1. **New BranchInventoryController** (`backend/app/Http/Controllers/BranchInventoryController.php`)
   - Unified API for both staff and admin inventory management
   - Full CRUD operations with proper permissions
   - Automatic stock synchronization across tables
   - Low stock alerts and notifications

2. **Updated Database Migration** (`backend/database/migrations/2025_10_14_000000_consolidate_inventory_system.php`)
   - Ensures all products have corresponding branch_stock entries
   - Synchronizes stock quantities across Products and BranchStock tables
   - Adds performance indexes
   - Database-agnostic (works with both MySQL and SQLite)

3. **New API Endpoints**
   ```
   GET  /api/branch-inventory              - Get inventory for user's branch or all branches
   POST /api/branch-inventory              - Add new product to branch inventory
   PUT  /api/branch-inventory/{id}         - Update inventory item
   DELETE /api/branch-inventory/{id}       - Remove product from branch inventory
   GET  /api/branch-inventory/alerts/low-stock  - Get low stock alerts
   GET  /api/branch-inventory/consolidated - Admin: Get consolidated inventory view
   ```

### Frontend Improvements

1. **New UnifiedStaffInventory Component** (`frontend--/src/features/inventory/components/UnifiedStaffInventory.tsx`)
   - Clean, modern interface for staff inventory management
   - Add products with full details (name, SKU, brand, model, price, stock)
   - Update stock quantities and thresholds
   - **Delete products from branch inventory**
   - Real-time summary cards (Total Items, In Stock, Low Stock, Out of Stock, Total Value)
   - Advanced search and filtering
   - Auto-refresh every 30 seconds

2. **New AdminConsolidatedInventory Component** (`frontend--/src/features/inventory/components/AdminConsolidatedInventory.tsx`)
   - System-wide inventory view across all branches
   - Expandable product cards showing branch-specific availability
   - Visual indicators for stock status
   - Total stock value calculation
   - Low stock and out-of-stock tracking

---

## Installation Steps

### Step 1: Run the Migration

Navigate to your backend directory and run the migration:

```bash
cd backend
php artisan migrate --path=database/migrations/2025_10_14_000000_consolidate_inventory_system.php
```

This migration will:
- Create branch_stock entries for all existing products
- Synchronize stock quantities across tables
- Add performance indexes
- Ensure data consistency

**Expected Output:**
```
✓ Inventory system consolidated successfully
✓ All products now have branch_stock entries
✓ Stock quantities synchronized across tables
```

### Step 2: Verify the Installation

Check that the migration ran successfully:

```bash
php artisan migrate:status
```

You should see `2025_10_14_000000_consolidate_inventory_system` with status "Ran".

### Step 3: Test the API Endpoints

Test the new inventory endpoints:

```bash
# Get branch inventory (as staff)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/branch-inventory

# Get consolidated inventory (as admin)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://127.0.0.1:8000/api/branch-inventory/consolidated
```

---

## Using the New System

### For Staff Members

1. **Access Inventory Management**
   - Navigate to: `/staff/inventory`
   - You'll see the new Unified Staff Inventory interface

2. **Add New Products**
   - Click the "Add Product" button
   - Fill in product details:
     - Product Name (required)
     - SKU (required)
     - Brand and Model (optional)
     - Description
     - Price (required)
     - Stock Quantity (required)
     - Minimum Threshold
     - Expiry Date (optional)
   - Click "Add Product"
   - The product is automatically added to your branch inventory

3. **Update Stock Levels**
   - Click the "Edit" icon (pencil) on any product
   - Update stock quantity, threshold, or price override
   - Click "Update"
   - Changes are immediately reflected in the admin view

4. **Delete Products**
   - Click the "Delete" icon (trash can) on any product
   - Confirm the deletion
   - The product is removed from your branch inventory
   - If the product doesn't exist in any other branch, it's marked as inactive system-wide

5. **View Stock Status**
   - **Green Badge (In Stock)**: Stock is above minimum threshold
   - **Yellow Badge (Low Stock)**: Stock is at or below minimum threshold
   - **Red Badge (Out of Stock)**: No stock available

6. **Search and Filter**
   - Use the search bar to find products by name, SKU, brand, or model
   - Use the status filter to view only In Stock, Low Stock, or Out of Stock items
   - Click "Refresh" to manually reload inventory data

### For Admin

1. **Access Consolidated Inventory**
   - Navigate to: `/admin/inventory/consolidated`
   - You'll see a system-wide view of all inventory

2. **View Product Details**
   - Click on any product card to expand it
   - See branch-specific stock levels
   - View reserved quantities and availability
   - Check branch-specific pricing overrides

3. **Monitor System Health**
   - View summary cards:
     - Total Products
     - Total Stock Value
     - Low Stock Products
     - Out of Stock Products
   - Use these metrics to make informed restocking decisions

4. **Manage Branch-Specific Stock**
   - Admins can also use the `/admin/inventory` route for traditional inventory management
   - Or switch to consolidated view for system-wide oversight

---

## Key Features

### 1. Branch-Specific Control

Staff members can now:
- Add products specific to their branch
- Update stock levels independently
- **Delete products from their branch** without affecting other branches
- Set branch-specific price overrides
- View only their branch's inventory

### 2. Automatic Synchronization

The system automatically:
- Updates the Products table when branch stock changes
- Recalculates total stock quantities across all branches
- Updates stock status (In Stock / Low Stock / Out of Stock)
- Sends low stock notifications to admins

### 3. Data Integrity

The system ensures:
- Products are never orphaned (always linked to at least one branch)
- Stock quantities are consistent across tables
- Reserved quantities are tracked separately
- Historical data is preserved

### 4. Performance Optimizations

The migration adds indexes for:
- `branch_stock (branch_id, product_id)` - Fast lookups
- `branch_stock (status, branch_id)` - Quick filtering
- Improved query performance for large inventories

---

## API Reference

### Staff Endpoints

#### Get Branch Inventory
```http
GET /api/branch-inventory
Authorization: Bearer {staff_token}
```

**Response:**
```json
{
  "inventories": [
    {
      "id": 1,
      "branch_id": 2,
      "product_id": 5,
      "product_name": "Designer Eyeglasses",
      "sku": "EYE-001",
      "brand": "Ray-Ban",
      "model": "RB3025",
      "stock_quantity": 50,
      "available_quantity": 45,
      "reserved_quantity": 5,
      "min_threshold": 10,
      "status": "in_stock",
      "price": 150.00,
      "effective_price": 150.00,
      "branch": {
        "id": 2,
        "name": "Unitop Branch",
        "code": "UNITOP"
      }
    }
  ],
  "summary": {
    "total_items": 25,
    "in_stock": 20,
    "low_stock": 3,
    "out_of_stock": 2,
    "total_value": 15000.00,
    "branches_count": 1
  }
}
```

#### Add Product to Inventory
```http
POST /api/branch-inventory
Authorization: Bearer {staff_token}
Content-Type: application/json

{
  "name": "Designer Eyeglasses",
  "sku": "EYE-001",
  "brand": "Ray-Ban",
  "model": "RB3025",
  "description": "Classic aviator sunglasses",
  "price": 150.00,
  "stock_quantity": 50,
  "min_stock_threshold": 10,
  "expiry_date": "2026-12-31"
}
```

#### Update Inventory Item
```http
PUT /api/branch-inventory/{id}
Authorization: Bearer {staff_token}
Content-Type: application/json

{
  "stock_quantity": 30,
  "min_stock_threshold": 10,
  "price_override": 140.00
}
```

#### Delete Product from Branch
```http
DELETE /api/branch-inventory/{id}
Authorization: Bearer {staff_token}
```

**Response:**
```json
{
  "message": "Product removed from branch inventory successfully",
  "remaining_branches": 2
}
```

### Admin Endpoints

#### Get Consolidated Inventory
```http
GET /api/branch-inventory/consolidated
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "products": [
    {
      "id": 5,
      "name": "Designer Eyeglasses",
      "sku": "EYE-001",
      "brand": "Ray-Ban",
      "model": "RB3025",
      "price": 150.00,
      "total_stock": 150,
      "total_reserved": 15,
      "available_stock": 135,
      "branches_count": 3,
      "branch_availability": [
        {
          "branch_id": 1,
          "branch_name": "Main Branch",
          "branch_code": "MAIN",
          "stock_quantity": 50,
          "reserved_quantity": 5,
          "available_quantity": 45,
          "status": "In Stock",
          "price_override": null
        },
        {
          "branch_id": 2,
          "branch_name": "Unitop Branch",
          "branch_code": "UNITOP",
          "stock_quantity": 100,
          "reserved_quantity": 10,
          "available_quantity": 90,
          "status": "In Stock",
          "price_override": 140.00
        }
      ]
    }
  ],
  "summary": {
    "total_products": 50,
    "total_stock_value": 75000.00,
    "low_stock_count": 5,
    "out_of_stock_count": 2
  }
}
```

---

## Database Schema

### Products Table
```sql
- id (primary key)
- name
- sku (unique)
- brand
- model
- description
- price
- stock_quantity (sum of all branch stocks)
- min_stock_threshold
- is_active
- branch_id (creating branch)
- created_by
- created_by_role
- approval_status
```

### BranchStock Table
```sql
- id (primary key)
- product_id (foreign key)
- branch_id (foreign key)
- stock_quantity
- reserved_quantity
- available_quantity (computed: stock - reserved)
- min_stock_threshold
- status (In Stock / Low Stock / Out of Stock)
- price_override (optional branch-specific pricing)
- expiry_date
- last_restock_date
- auto_restock_enabled
- auto_restock_quantity
- is_active
```

---

## Troubleshooting

### Migration Issues

**Problem:** Migration fails with "NOW() function not found"  
**Solution:** The migration has been updated to support both MySQL and SQLite. Re-run the migration.

**Problem:** Duplicate entry errors  
**Solution:** The migration includes checks to prevent duplicates. If you still encounter issues, ensure you're running the latest version of the migration file.

### API Issues

**Problem:** 401 Unauthorized  
**Solution:** Ensure you're including the correct Bearer token in the Authorization header.

**Problem:** 403 Forbidden (Staff trying to delete)  
**Solution:** Staff can only delete products from their own branch. Check that the branch_id matches.

**Problem:** Product not appearing in inventory  
**Solution:** Check that:
1. The product has a branch_stock entry
2. The product is_active = true
3. The staff member is viewing the correct branch

### Frontend Issues

**Problem:** Components not loading  
**Solution:** Ensure the new components are properly imported in `App.tsx` and routes are configured.

**Problem:** Data not refreshing  
**Solution:** 
1. Check that auto-refresh is working (30-second interval for staff, 60-second for admin)
2. Manually click the "Refresh" button
3. Check browser console for API errors

---

## Best Practices

### For Staff

1. **Regular Stock Updates**: Update stock levels after each sale or restocking
2. **Set Appropriate Thresholds**: Configure min_threshold based on sales velocity
3. **Use Expiry Dates**: Track products with expiration dates
4. **Check Low Stock Alerts**: Review low stock items regularly

### For Admin

1. **Monitor Consolidated View**: Check system-wide inventory daily
2. **Review Low Stock Alerts**: Coordinate restocking across branches
3. **Analyze Branch Performance**: Use branch availability data for insights
4. **Maintain Data Quality**: Ensure product information is accurate and up-to-date

### For Developers

1. **Always Use Transactions**: Wrap multi-table updates in DB transactions
2. **Validate Branch Permissions**: Always check user branch_id before operations
3. **Sync Stock Quantities**: Update Products table when BranchStock changes
4. **Handle Soft Deletes**: Use is_active flag instead of hard deletes
5. **Send Notifications**: Alert admins on low stock and critical events

---

## Migration Rollback

If you need to rollback the migration:

```bash
php artisan migrate:rollback --path=database/migrations/2025_10_14_000000_consolidate_inventory_system.php
```

**Warning:** This will:
- Remove the `is_active` column from branch_stock
- Remove performance indexes
- NOT restore previous data state (data synchronization is irreversible)

---

## Support

If you encounter any issues or need assistance:

1. Check the browser console for JavaScript errors
2. Check Laravel logs: `backend/storage/logs/laravel.log`
3. Verify API responses using tools like Postman or curl
4. Ensure database migrations are up to date: `php artisan migrate:status`

---

## Summary

The upgraded inventory system provides:

✅ **Complete Branch Autonomy** - Staff can fully manage their branch inventory  
✅ **Centralized Oversight** - Admin can monitor and manage system-wide inventory  
✅ **Data Consistency** - Automatic synchronization ensures accurate stock levels  
✅ **Better Performance** - Optimized database queries with proper indexes  
✅ **Enhanced UX** - Modern, intuitive interfaces for both staff and admin  

The system is now ready for production use with full branch-specific inventory control!

