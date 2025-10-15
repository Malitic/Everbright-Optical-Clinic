<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\BranchStock;
use App\Models\Branch;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Unified Branch Inventory Controller
 * Handles all inventory operations for both staff and admin
 */
class BranchInventoryController extends Controller
{
    /**
     * Get inventory for user's branch or all branches (admin)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = BranchStock::with(['branch:id,name,code', 'product:id,name,sku,description,price,image_paths,is_active,brand,model']);

        // Staff can only view their own branch inventory
        if ($user->role->value === 'staff') {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'Staff member is not assigned to any branch',
                    'inventories' => [],
                    'summary' => $this->getEmptySummary()
                ], 200);
            }
            $query->where('branch_id', $user->branch_id);
        }

        // Admin can filter by branch if specified
        if ($user->role->value === 'admin' && $request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by product name or SKU
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        // Only show products that are active
        $query->whereHas('product', function($q) {
            $q->where('is_active', true);
        });

        $inventories = $query->orderBy('branch_id')
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform data
        $transformedInventories = $inventories->map(function ($item) {
            return $this->transformInventoryItem($item);
        });

        // Calculate summary
        $summary = $this->calculateSummary($inventories);

        return response()->json([
            'inventories' => $transformedInventories,
            'summary' => $summary,
            'user_branch_id' => $user->branch_id,
            'user_role' => $user->role->value
        ]);
    }

    /**
     * Create a new product and add it to branch inventory
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Staff and Admin can add products.'
            ], 403);
        }

        // Determine which branch to add to
        $branchId = $user->role->value === 'staff' ? $user->branch_id : $request->branch_id;

        if (!$branchId) {
            return response()->json([
                'message' => 'Branch ID is required'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_threshold' => 'nullable|integer|min:0',
            'sku' => 'required|string|max:100|unique:products,sku',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:product_categories,id',
            'images' => 'nullable|array|max:4',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'expiry_date' => 'nullable|date|after:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Handle image uploads
            $imagePaths = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('products', 'public');
                    $imagePaths[] = $path;
                }
            }

            // Create the product
            $product = Product::create([
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'stock_quantity' => $request->stock_quantity,
                'sku' => $request->sku,
                'brand' => $request->brand,
                'model' => $request->model,
                'category_id' => $request->category_id,
                'image_paths' => $imagePaths,
                'primary_image' => $imagePaths[0] ?? null,
                'is_active' => true,
                'created_by' => $user->id,
                'created_by_role' => $user->role->value,
                'approval_status' => $user->role->value === 'admin' ? 'approved' : 'approved', // Staff products are now auto-approved
                'branch_id' => $branchId,
                'min_stock_threshold' => $request->min_stock_threshold ?? 5,
            ]);

            // Create branch stock entry
            $minThreshold = $request->min_stock_threshold ?? 5;
            $stockQuantity = $request->stock_quantity;
            
            $branchStock = BranchStock::create([
                'product_id' => $product->id,
                'branch_id' => $branchId,
                'stock_quantity' => $stockQuantity,
                'reserved_quantity' => 0,
                'min_stock_threshold' => $minThreshold,
                'status' => $this->calculateStatus($stockQuantity, $minThreshold),
                'price_override' => $request->price_override ?? null,
                'expiry_date' => $request->expiry_date,
                'auto_restock_enabled' => $request->auto_restock_enabled ?? false,
                'auto_restock_quantity' => $request->auto_restock_quantity ?? null,
                'is_active' => true,
            ]);

            DB::commit();

            // Load relationships
            $branchStock->load(['product', 'branch']);

            return response()->json([
                'message' => 'Product added to inventory successfully',
                'inventory' => $this->transformInventoryItem($branchStock)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Clean up uploaded images on error
            if (!empty($imagePaths)) {
                foreach ($imagePaths as $path) {
                    Storage::disk('public')->delete($path);
                }
            }

            return response()->json([
                'message' => 'Failed to add product to inventory',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update inventory item (stock quantity, price, etc.)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $branchStock = BranchStock::findOrFail($id);

        // Staff can only update items in their own branch
        if ($user->role->value === 'staff' && $user->branch_id !== $branchStock->branch_id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only update items in their own branch.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'min_stock_threshold' => 'sometimes|required|integer|min:0',
            'price_override' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'auto_restock_enabled' => 'boolean',
            'auto_restock_quantity' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $oldQuantity = $branchStock->stock_quantity;

            // Update branch stock
            $updateData = [];
            if ($request->has('stock_quantity')) {
                $updateData['stock_quantity'] = $request->stock_quantity;
                $updateData['last_restock_date'] = now();
            }
            if ($request->has('min_stock_threshold')) {
                $updateData['min_stock_threshold'] = $request->min_stock_threshold;
            }
            if ($request->has('price_override')) {
                $updateData['price_override'] = $request->price_override;
            }
            if ($request->has('expiry_date')) {
                $updateData['expiry_date'] = $request->expiry_date;
            }
            if ($request->has('auto_restock_enabled')) {
                $updateData['auto_restock_enabled'] = $request->auto_restock_enabled;
            }
            if ($request->has('auto_restock_quantity')) {
                $updateData['auto_restock_quantity'] = $request->auto_restock_quantity;
            }

            // Calculate new status
            $newQuantity = $request->stock_quantity ?? $branchStock->stock_quantity;
            $newThreshold = $request->min_stock_threshold ?? $branchStock->min_stock_threshold;
            $updateData['status'] = $this->calculateStatus($newQuantity, $newThreshold);

            $branchStock->update($updateData);

            // Update product's total stock quantity
            $this->syncProductStockQuantity($branchStock->product_id);

            // Check and send alerts if stock is low
            if ($newQuantity <= $newThreshold && $oldQuantity > $newThreshold) {
                $this->sendLowStockAlert($branchStock);
            }

            DB::commit();

            // Load relationships
            $branchStock->load(['product', 'branch']);

            return response()->json([
                'message' => 'Inventory updated successfully',
                'inventory' => $this->transformInventoryItem($branchStock)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Inventory update failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to update inventory',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Delete product from branch inventory (Staff can delete from their branch, Admin can delete from any branch)
     */
    public function destroy($id): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $branchStock = BranchStock::findOrFail($id);

        // Staff can only delete items from their own branch
        if ($user->role->value === 'staff' && $user->branch_id !== $branchStock->branch_id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only delete items from their own branch.'
            ], 403);
        }

        try {
            DB::beginTransaction();

            $productId = $branchStock->product_id;
            $branchStock->delete();

            // Check if product exists in any other branches
            $remainingStock = BranchStock::where('product_id', $productId)->count();

            // If product doesn't exist in any branch, mark it as inactive
            if ($remainingStock === 0) {
                $product = Product::find($productId);
                if ($product) {
                    $product->update(['is_active' => false]);
                }
            } else {
                // Update product's total stock quantity
                $this->syncProductStockQuantity($productId);
            }

            DB::commit();

            return response()->json([
                'message' => 'Product removed from branch inventory successfully',
                'remaining_branches' => $remainingStock
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get low stock alerts for user's branch or all branches (admin)
     */
    public function getLowStockAlerts(): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = BranchStock::with(['product', 'branch'])
            ->whereIn('status', ['Low Stock', 'Out of Stock'])
            ->whereHas('product', function($q) {
                $q->where('is_active', true);
            });

        // Staff can only see alerts for their branch
        if ($user->role->value === 'staff') {
            $query->where('branch_id', $user->branch_id);
        }

        $alerts = $query->orderByRaw("FIELD(status, 'Out of Stock', 'Low Stock')")
            ->orderBy('stock_quantity', 'asc')
            ->get()
            ->map(function ($item) {
                return $this->transformInventoryItem($item);
            });

        return response()->json([
            'alerts' => $alerts,
            'count' => $alerts->count()
        ]);
    }

    /**
     * Get consolidated inventory view for admin (all branches)
     */
    public function getConsolidatedInventory(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can view consolidated inventory.'
            ], 403);
        }

        // Get all products with their branch stock information
        $products = Product::with(['branchStock.branch'])
            ->where('is_active', true)
            ->get()
            ->map(function ($product) {
                $totalStock = $product->branchStock->sum('stock_quantity');
                $totalReserved = $product->branchStock->sum('reserved_quantity');
                $availableStock = $totalStock - $totalReserved;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'brand' => $product->brand,
                    'model' => $product->model,
                    'price' => $product->price,
                    'total_stock' => $totalStock,
                    'total_reserved' => $totalReserved,
                    'available_stock' => $availableStock,
                    'branches_count' => $product->branchStock->count(),
                    'branch_availability' => $product->branchStock->map(function ($stock) {
                        return [
                            'branch_id' => $stock->branch_id,
                            'branch_name' => $stock->branch->name,
                            'branch_code' => $stock->branch->code,
                            'stock_quantity' => $stock->stock_quantity,
                            'reserved_quantity' => $stock->reserved_quantity,
                            'available_quantity' => $stock->available_quantity,
                            'status' => $stock->status,
                            'price_override' => $stock->price_override,
                        ];
                    }),
                    'image' => $product->primary_image ?? ($product->image_paths[0] ?? null),
                ];
            });

        return response()->json([
            'products' => $products,
            'summary' => [
                'total_products' => $products->count(),
                'total_stock_value' => $products->sum(function($p) {
                    return $p['available_stock'] * $p['price'];
                }),
                'low_stock_count' => $products->filter(function($p) {
                    return $p['available_stock'] > 0 && $p['available_stock'] <= 10;
                })->count(),
                'out_of_stock_count' => $products->filter(function($p) {
                    return $p['available_stock'] <= 0;
                })->count(),
            ]
        ]);
    }

    // ===== Private Helper Methods =====

    private function transformInventoryItem($branchStock): array
    {
        return [
            'id' => $branchStock->id,
            'branch_id' => $branchStock->branch_id,
            'product_id' => $branchStock->product_id,
            'product_name' => $branchStock->product->name,
            'sku' => $branchStock->product->sku,
            'brand' => $branchStock->product->brand,
            'model' => $branchStock->product->model,
            'description' => $branchStock->product->description,
            'stock_quantity' => $branchStock->stock_quantity,
            'reserved_quantity' => $branchStock->reserved_quantity,
            'available_quantity' => $branchStock->available_quantity,
            'min_threshold' => $branchStock->min_stock_threshold,
            'status' => strtolower(str_replace(' ', '_', $branchStock->status)),
            'price' => $branchStock->product->price,
            'price_override' => $branchStock->price_override,
            'effective_price' => $branchStock->price_override ?? $branchStock->product->price,
            'expiry_date' => $branchStock->expiry_date,
            'last_restock_date' => $branchStock->last_restock_date,
            'auto_restock_enabled' => $branchStock->auto_restock_enabled,
            'auto_restock_quantity' => $branchStock->auto_restock_quantity,
            'is_active' => $branchStock->product->is_active,
            'images' => $branchStock->product->image_paths,
            'primary_image' => $branchStock->product->primary_image,
            'branch' => [
                'id' => $branchStock->branch->id,
                'name' => $branchStock->branch->name,
                'code' => $branchStock->branch->code,
            ],
            'created_at' => $branchStock->created_at,
            'updated_at' => $branchStock->updated_at,
        ];
    }

    private function calculateSummary($inventories): array
    {
        return [
            'total_items' => $inventories->count(),
            'in_stock' => $inventories->where('status', 'In Stock')->count(),
            'low_stock' => $inventories->where('status', 'Low Stock')->count(),
            'out_of_stock' => $inventories->where('status', 'Out of Stock')->count(),
            'total_value' => $inventories->sum(function ($item) {
                $effectivePrice = $item->price_override !== null 
                    ? (float) $item->price_override 
                    : (float) $item->product->price;
                return $item->stock_quantity * $effectivePrice;
            }),
            'branches_count' => $inventories->pluck('branch_id')->unique()->count(),
        ];
    }

    private function getEmptySummary(): array
    {
        return [
            'total_items' => 0,
            'in_stock' => 0,
            'low_stock' => 0,
            'out_of_stock' => 0,
            'total_value' => 0,
            'branches_count' => 0,
        ];
    }

    private function calculateStatus($quantity, $minThreshold): string
    {
        if ($quantity <= 0) {
            return 'Out of Stock';
        } elseif ($quantity <= $minThreshold) {
            return 'Low Stock';
        } else {
            return 'In Stock';
        }
    }

    private function syncProductStockQuantity($productId): void
    {
        $totalStock = BranchStock::where('product_id', $productId)->sum('stock_quantity');
        Product::where('id', $productId)->update(['stock_quantity' => $totalStock]);
    }

    private function sendLowStockAlert(BranchStock $branchStock): void
    {
        try {
            $message = "Low stock alert: {$branchStock->product->name} at {$branchStock->branch->name} - Only {$branchStock->stock_quantity} units remaining";

            // Send notification to all admin users
            $admins = \App\Models\User::where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'role' => 'admin',
                    'title' => 'Low Stock Alert',
                    'message' => $message,
                    'type' => 'low_stock_alert',
                    'data' => json_encode([
                        'branch_stock_id' => $branchStock->id,
                        'product_id' => $branchStock->product_id,
                        'branch_id' => $branchStock->branch_id,
                        'product_name' => $branchStock->product->name,
                        'quantity' => $branchStock->stock_quantity,
                        'available_quantity' => $branchStock->available_quantity,
                        'status' => $branchStock->status,
                    ]),
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the update
            \Log::warning('Failed to send low stock alert: ' . $e->getMessage());
        }
    }
}

