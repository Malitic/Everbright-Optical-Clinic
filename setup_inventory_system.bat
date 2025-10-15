@echo off
echo ========================================
echo    Inventory System Setup Script
echo ========================================
echo.

echo [1/3] Navigating to backend directory...
cd backend
if errorlevel 1 (
    echo ERROR: Could not find backend directory
    pause
    exit /b 1
)

echo [2/3] Running inventory consolidation migration...
echo.
php artisan migrate --path=database/migrations/2025_10_14_000000_consolidate_inventory_system.php
if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo Please check the error message above.
    cd ..
    pause
    exit /b 1
)

echo.
echo [3/3] Verifying migration status...
php artisan migrate:status | findstr "consolidate_inventory_system"

cd ..

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo ✓ Inventory system consolidated successfully
echo ✓ All products now have branch_stock entries
echo ✓ Stock quantities synchronized across tables
echo.
echo NEXT STEPS:
echo 1. Start your backend server: cd backend ^&^& php artisan serve
echo 2. Start your frontend server: npm run dev
echo 3. Login as STAFF and visit: http://localhost:5173/staff/inventory
echo 4. Login as ADMIN and visit: http://localhost:5173/admin/inventory/consolidated
echo.
echo For detailed documentation, see:
echo - INVENTORY_FIX_SUMMARY.md
echo - INVENTORY_SYSTEM_UPGRADE_GUIDE.md
echo.
pause

