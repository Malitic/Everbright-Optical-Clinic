<?php

namespace App\Http\Controllers;

use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\NotificationController;

class BranchStockController extends Controller
{
    /**
     * Get stock for all branches (Admin only)
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        // Only admin can view all branch stock
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can view all branch stock.'
            ], 403);
        }

        $stock = BranchStock::with(['product', 'branch'])
            ->orderBy('branch_id')
            ->orderBy('product_id')
            ->get();

        return response()->json([
            'stock' => $stock,
            'summary' => [
                'total_products' => $stock->count(),
                'in_stock' => $stock->where('available_quantity', '>', 0)->count(),
                'low_stock' => $stock->where('available_quantity', '>', 0)->where('available_quantity', '<', 5)->count(),
                'out_of_stock' => $stock->where('available_quantity', '<=', 0)->count(),
            ]
        ]);
    }

    /**
     * Get stock for a specific branch
     */
    public function getBranchStock(Branch $branch): JsonResponse
    {
        $user = Auth::user();

        // Admin can view any branch, staff can only view their own branch
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->role->value === 'staff' && $user->branch_id !== $branch->id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only view their own branch stock.'
            ], 403);
        }

        $stock = BranchStock::with('product')
            ->where('branch_id', $branch->id)
            ->orderBy('product_id')
            ->get();

        return response()->json([
            'branch' => $branch,
            'stock' => $stock,
            'summary' => [
                'total_products' => $stock->count(),
                'in_stock' => $stock->where('available_quantity', '>', 0)->count(),
                'low_stock' => $stock->where('available_quantity', '>', 0)->where('available_quantity', '<', 5)->count(),
                'out_of_stock' => $stock->where('available_quantity', '<=', 0)->count(),
            ]
        ]);
    }

    /**
     * Update stock for a specific product at a branch (Admin and Staff)
     */
    public function updateStock(Request $request, Product $product, Branch $branch): JsonResponse
    {
        $user = Auth::user();

        // Admin can update any branch, staff can only update their own branch
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->role->value === 'staff' && $user->branch_id !== $branch->id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only update their own branch stock.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'stock_quantity' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update or create branch stock record
        $branchStock = BranchStock::updateOrCreate(
            ['product_id' => $product->id, 'branch_id' => $branch->id],
            ['stock_quantity' => $request->stock_quantity]
        );

        // Check for low stock and send notifications
        $availableQuantity = $request->stock_quantity - ($branchStock->reserved_quantity ?? 0);
        $minThreshold = $branchStock->min_stock_threshold ?? 5;
        if ($availableQuantity <= $minThreshold) {
            NotificationController::createLowStockNotification(
                $branch->id,
                $product->name,
                $availableQuantity
            );
            
            // Send real-time notification
            WebSocketService::notifyInventoryUpdate(
                $product,
                $branch,
                'low_stock',
                "Low stock alert: {$product->name} has {$availableQuantity} items remaining",
                $availableQuantity,
                $minThreshold
            );
        }

        return response()->json([
            'message' => 'Stock updated successfully',
            'branch_stock' => [
                'id' => $branchStock->id,
                'product_id' => $branchStock->product_id,
                'branch_id' => $branchStock->branch_id,
                'stock_quantity' => $branchStock->stock_quantity,
                'reserved_quantity' => $branchStock->reserved_quantity,
                'available_quantity' => $branchStock->available_quantity,
                'status' => $branchStock->status,
                'price_override' => $branchStock->price_override,
                'min_stock_threshold' => $branchStock->min_stock_threshold,
                'expiry_date' => $branchStock->expiry_date,
                'last_restock_date' => $branchStock->last_restock_date,
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'price' => $product->price,
                ]
            ]
        ]);
    }

    /**
     * Set stock for all branches for a product (Admin only)
     */
    public function setProductStockForAllBranches(Request $request, Product $product): JsonResponse
    {
        $user = Auth::user();

        // Only admin can set stock for all branches
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can set stock for all branches.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'branch_stocks' => 'required|array',
            'branch_stocks.*.branch_id' => 'required|exists:branches,id',
            'branch_stocks.*.stock_quantity' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::transaction(function () use ($request, $product) {
            foreach ($request->branch_stocks as $stockData) {
                BranchStock::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $stockData['branch_id']
                    ],
                    [
                        'stock_quantity' => $stockData['stock_quantity']
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Stock set for all branches successfully',
            'product' => $product->load('branchStock.branch')
        ]);
    }

    /**
     * Get low stock alerts (Admin and Staff)
     */
    public function getLowStockAlerts(): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = BranchStock::with(['product', 'branch'])
            ->lowStock();

        // Staff can only see alerts for their branch
        if ($user->role->value === 'staff') {
            $query->where('branch_id', $user->branch_id);
        }

        $lowStockItems = $query->get();

        return response()->json([
            'low_stock_items' => $lowStockItems,
            'count' => $lowStockItems->count()
        ]);
    }

    /**
     * Get product availability across all branches (Customer view)
     */
    public function getProductAvailability(Product $product): JsonResponse
    {
        $branchStock = BranchStock::with('branch')
            ->where('product_id', $product->id)
            ->whereRaw('stock_quantity > reserved_quantity')
            ->get();

        $availability = $branchStock->map(function ($stock) {
            return [
                'branch' => $stock->branch,
                'available_quantity' => $stock->available_quantity,
                'stock_quantity' => $stock->stock_quantity,
                'reserved_quantity' => $stock->reserved_quantity,
            ];
        });

        return response()->json([
            'product' => $product,
            'availability' => $availability,
            'total_available' => $availability->sum('available_quantity'),
            'branches_with_stock' => $availability->count()
        ]);
    }

    /**
     * Get stock information for a specific product in a specific branch
     */
    public function getProductBranchStock(Product $product, Branch $branch): JsonResponse
    {
        $branchStock = BranchStock::where('product_id', $product->id)
            ->where('branch_id', $branch->id)
            ->first();

        if (!$branchStock) {
            return response()->json([
                'error' => 'Product not found in this branch',
                'product_id' => $product->id,
                'branch_id' => $branch->id,
                'stock' => 0,
                'available_quantity' => 0,
                'status' => 'Not Available',
                'price' => $product->price,
                'effective_price' => $product->price,
            ], 404);
        }

        // Calculate effective price without using the accessor to avoid circular queries
        $effectivePrice = $branchStock->price_override !== null 
            ? (float) $branchStock->price_override 
            : (float) $product->price;

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'brand' => $product->brand,
                'category' => $product->category ? $product->category->name : null,
                'sku' => $product->sku,
                'image' => $product->primary_image_path ?? ($product->image_paths[0] ?? null),
                'description' => $product->description,
            ],
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
            ],
            'stock' => $branchStock->stock_quantity,
            'reserved_quantity' => $branchStock->reserved_quantity,
            'available_quantity' => $branchStock->available_quantity,
            'status' => $branchStock->status,
            'price' => $product->price,
            'effective_price' => $effectivePrice,
            'price_override' => $branchStock->price_override,
            'min_stock_threshold' => $branchStock->min_stock_threshold,
            'expiry_date' => $branchStock->expiry_date,
            'last_restock_date' => $branchStock->last_restock_date,
        ]);
    }
}
