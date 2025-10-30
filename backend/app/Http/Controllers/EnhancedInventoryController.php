<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\BranchStock;
use App\Models\RestockRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnhancedInventoryController extends Controller
{
    /**
     * Get inventory with expiry tracking and auto-restock information
     */
    public function getEnhancedInventory(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $query = BranchStock::with(['product', 'branch'])
                ->select('*')
                ->selectRaw('(stock_quantity - reserved_quantity) as available_quantity');

            // Filter by user's branch if they're staff
            if ($user->role === 'staff' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }

            // Filter by branch if specified
            if ($request->has('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }

            // Filter by low stock
            if ($request->has('low_stock') && $request->boolean('low_stock')) {
                $query->whereRaw('(stock_quantity - reserved_quantity) <= COALESCE(min_stock_threshold, 5)');
            }

            // Filter by expiring soon
            if ($request->has('expiring_soon') && $request->boolean('expiring_soon')) {
                $query->where('expiry_date', '<=', now()->addDays(30))
                      ->where('expiry_date', '>', now());
            }

            // Filter by expired
            if ($request->has('expired') && $request->boolean('expired')) {
                $query->where('expiry_date', '<', now());
            }

            $inventory = $query->orderBy('expiry_date', 'asc')
                             ->orderBy('available_quantity', 'asc')
                             ->get();

            // Add status information
            $inventory->each(function ($item) {
                $item->status = $this->getInventoryStatus($item);
                $item->days_until_expiry = $item->expiry_date ? now()->diffInDays($item->expiry_date, false) : null;
            });

            return response()->json([
                'inventory' => $inventory,
                'summary' => $this->getInventorySummary($inventory)
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get enhanced inventory: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve inventory'], 500);
        }
    }

    /**
     * Get expiring products
     */
    public function getExpiringProducts(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $days = $request->get('days', 30);
            
            $query = BranchStock::with(['product', 'branch'])
                ->where('expiry_date', '<=', now()->addDays($days))
                ->where('expiry_date', '>', now())
                ->where('stock_quantity', '>', 0);

            // Filter by user's branch if they're staff
            if ($user->role === 'staff' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
            
            $expiringProducts = $query->orderBy('expiry_date', 'asc')->get();

            $expiringProducts->each(function ($item) {
                $item->days_until_expiry = now()->diffInDays($item->expiry_date, false);
            });

            return response()->json([
                'expiring_products' => $expiringProducts,
                'count' => $expiringProducts->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get expiring products: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve expiring products'], 500);
        }
    }

    /**
     * Get low stock alerts
     */
    public function getLowStockAlerts(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $query = BranchStock::with(['product', 'branch'])
                ->whereRaw('(stock_quantity - reserved_quantity) <= COALESCE(min_stock_threshold, 5)')
                ->where('stock_quantity', '>', 0);

            // Filter by user's branch if they're staff
            if ($user->role === 'staff' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
            
            $lowStockItems = $query->orderBy('available_quantity', 'asc')->get();

            $lowStockItems->each(function ($item) {
                $item->available_quantity = $item->stock_quantity - $item->reserved_quantity;
                $item->needs_restock = $item->available_quantity <= ($item->min_stock_threshold ?? 5);
            });

            return response()->json([
                'low_stock_items' => $lowStockItems,
                'count' => $lowStockItems->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get low stock alerts: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve low stock alerts'], 500);
        }
    }

    /**
     * Process auto-restock for products
     */
    public function processAutoRestock(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $processedCount = 0;
            $errors = [];

            // Get all products with auto-restock enabled and low stock
            $lowStockItems = BranchStock::with(['product', 'branch'])
                ->where('auto_restock_enabled', true)
                ->whereRaw('(stock_quantity - reserved_quantity) <= COALESCE(min_stock_threshold, 5)')
                ->get();

            foreach ($lowStockItems as $item) {
                try {
                    // Create restock request
                    $restockRequest = RestockRequest::create([
                        'product_id' => $item->product_id,
                        'branch_id' => $item->branch_id,
                        'requested_quantity' => $item->auto_restock_quantity ?? $item->product->auto_restock_quantity ?? 10,
                        'requested_by' => $user->id,
                        'status' => 'pending',
                        'notes' => 'Auto-generated restock request due to low stock',
                        'auto_generated' => true
                    ]);

                    // Update last restock date
                    $item->update(['last_restock_date' => now()]);
                    
                    $processedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Failed to create restock request for {$item->product->name} at {$item->branch->name}: " . $e->getMessage();
                }
            }

            return response()->json([
                'message' => "Processed {$processedCount} auto-restock requests",
                'processed_count' => $processedCount,
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to process auto-restock: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to process auto-restock'], 500);
        }
    }

    /**
     * Update product expiry and restock settings
     */
    public function updateProductSettings(Request $request, Product $product): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!in_array($user->role, ['admin', 'staff'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validator = \Validator::make($request->all(), [
                'expiry_date' => 'nullable|date|after:today',
                'min_stock_threshold' => 'nullable|integer|min:1',
                'auto_restock_quantity' => 'nullable|integer|min:1',
                'auto_restock_enabled' => 'nullable|boolean',
                'branch_stock_settings' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update product settings if provided
            $productData = $request->only([
                'expiry_date',
                'min_stock_threshold',
                'auto_restock_quantity',
                'auto_restock_enabled'
            ]);
            
            // Filter out null values
            $productData = array_filter($productData, function($value) {
                return $value !== null;
            });
            
            if (!empty($productData)) {
                $product->update($productData);
            }

            // Update branch stock settings
            if ($request->has('branch_stock_settings')) {
                foreach ($request->branch_stock_settings as $branchId => $settings) {
                    $branchStockData = [];
                    if (isset($settings['expiry_date'])) {
                        $branchStockData['expiry_date'] = $settings['expiry_date'];
                    }
                    if (isset($settings['min_stock_threshold'])) {
                        $branchStockData['min_stock_threshold'] = $settings['min_stock_threshold'];
                    }
                    if (isset($settings['auto_restock_enabled'])) {
                        $branchStockData['auto_restock_enabled'] = $settings['auto_restock_enabled'];
                    }
                    if (isset($settings['auto_restock_quantity'])) {
                        $branchStockData['auto_restock_quantity'] = $settings['auto_restock_quantity'];
                    }
                    
                    if (!empty($branchStockData)) {
                        BranchStock::where('product_id', $product->id)
                                  ->where('branch_id', $branchId)
                                  ->update($branchStockData);
                    }
                }
            }

            return response()->json([
                'message' => 'Product settings updated successfully',
                'product' => $product->fresh()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update product settings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update product settings'], 500);
        }
    }

    /**
     * Get inventory analytics
     */
    public function getInventoryAnalytics(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $analytics = [
                'total_products' => Product::count(),
                'total_stock_value' => DB::table('branch_stock')
                    ->join('products', 'branch_stock.product_id', '=', 'products.id')
                    ->sum(DB::raw('branch_stock.stock_quantity * products.price')),
                'low_stock_count' => BranchStock::whereRaw('(stock_quantity - reserved_quantity) <= COALESCE(min_stock_threshold, 5)')
                    ->where('stock_quantity', '>', 0)
                    ->count(),
                'expiring_soon_count' => BranchStock::where('expiry_date', '<=', now()->addDays(30))
                    ->where('expiry_date', '>', now())
                    ->count(),
                'expired_count' => BranchStock::where('expiry_date', '<', now())
                    ->where('stock_quantity', '>', 0)
                    ->count(),
                'auto_restock_enabled_count' => BranchStock::where('auto_restock_enabled', true)->count(),
                'pending_restock_requests' => RestockRequest::where('status', 'pending')->count()
            ];

            // Stock movement trends (last 30 days)
            $stockMovement = DB::table('restock_requests')
                ->where('created_at', '>=', now()->subDays(30))
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as requests_count'),
                    DB::raw('SUM(requested_quantity) as total_quantity')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'analytics' => $analytics,
                'stock_movement' => $stockMovement
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get inventory analytics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve inventory analytics'], 500);
        }
    }

    /**
     * Private helper methods
     */
    private function getInventoryStatus($item): string
    {
        $available = $item->stock_quantity - $item->reserved_quantity;
        
        if ($item->expiry_date && $item->expiry_date < now()) {
            return 'expired';
        }
        
        if ($available <= 0) {
            return 'out_of_stock';
        }
        
        if ($available <= ($item->min_stock_threshold ?? 5)) {
            return 'low_stock';
        }
        
        if ($item->expiry_date && $item->expiry_date <= now()->addDays(30)) {
            return 'expiring_soon';
        }
        
        return 'in_stock';
    }

    private function getInventorySummary($inventory): array
    {
        $summary = [
            'total_items' => $inventory->count(),
            'in_stock' => 0,
            'low_stock' => 0,
            'out_of_stock' => 0,
            'expiring_soon' => 0,
            'expired' => 0
        ];

        foreach ($inventory as $item) {
            switch ($item->status) {
                case 'in_stock':
                    $summary['in_stock']++;
                    break;
                case 'low_stock':
                    $summary['low_stock']++;
                    break;
                case 'out_of_stock':
                    $summary['out_of_stock']++;
                    break;
                case 'expiring_soon':
                    $summary['expiring_soon']++;
                    break;
                case 'expired':
                    $summary['expired']++;
                    break;
            }
        }

        return $summary;
    }
}


