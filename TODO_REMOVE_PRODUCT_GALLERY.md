# TODO: Remove Product Gallery System

## Frontend Removal
- [x] Remove entire `frontend--/src/features/products` directory and all subdirectories (components, hooks, services, types, utils, config)
- [ ] Remove any references to product features in frontend routing or feature registration files

## Backend Removal
- [x] Remove `backend/app/Models/Product.php`
- [x] Remove `backend/app/Http/Controllers/ProductController.php`
- [x] Remove `backend/database/factories/ProductFactory.php`
- [x] Remove product-related migration files:
  - `backend/database/migrations/2025_08_30_000000_create_products_table.php`
  - `backend/database/migrations/2025_09_14_000000_update_products_table_add_image_paths.php`
  - `backend/database/migrations/2025_09_15_000000_add_created_by_role_to_products_table.php`
- [x] Remove product routes from `backend/routes/api.php`
- [ ] Remove any other product-related references in backend configuration or other files

## Cleanup
- [ ] Remove product-related TODO files:
  - `TODO_PRODUCT_GALLERY_LOCAL_STORAGE.md`
  - `TODO_PRODUCT_GALLERY_RESERVATION_SYSTEM.md`
  - `PRODUCT_GALLERY_TESTING_PLAN.md`
- [ ] Remove uploaded product images from `backend/public/uploads/products/`
- [ ] Verify no broken references remain in the codebase

## Verification
- [ ] Run tests to ensure no broken dependencies
- [ ] Check for any remaining product-related code or references
