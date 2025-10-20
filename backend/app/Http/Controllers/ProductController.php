<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\BranchStock;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Use Eloquent for better reliability
        $query = Product::with('creator');
        
        // Filter by active status and approval for customers
        if ($user && $user->role && $user->role->value === 'customer') {
            $query->where('is_active', true)
                  ->where('approval_status', 'approved');
        }
        
        // Filter by search term
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }
        
        $products = $query->orderBy('created_at', 'desc')->limit(100)->get();
        
        // Get branch data only if products exist
        $branchStockData = [];
        if ($products->isNotEmpty()) {
            $productIds = $products->pluck('id')->toArray();
            
            $branchStockData = DB::table('branch_stock as bs')
                ->join('branches as b', 'bs.branch_id', '=', 'b.id')
                ->whereIn('bs.product_id', $productIds)
                ->select('bs.*', 'b.name as branch_name', 'b.code as branch_code')
                ->get()
                ->groupBy('product_id');
        }
        
        $productsWithAvailability = $products->map(function ($product) use ($branchStockData) {
            $branchAvailability = collect($branchStockData->get($product->id, []))->map(function ($stock) {
                return [
                    'stock_id' => $stock->id,
                    'branch_id' => $stock->branch_id,
                    'branch' => [
                        'id' => $stock->branch_id,
                        'name' => $stock->branch_name,
                        'code' => $stock->branch_code,
                    ],
                    'available_quantity' => $stock->stock_quantity - ($stock->reserved_quantity ?? 0),
                    'stock_quantity' => $stock->stock_quantity,
                    'reserved_quantity' => $stock->reserved_quantity ?? 0,
                    'min_stock_threshold' => $stock->min_stock_threshold ?? 5,
                    'status' => $stock->status ?? 'Out of Stock',
                    'is_available' => ($stock->stock_quantity - ($stock->reserved_quantity ?? 0)) > 0,
                ];
            });

            // Calculate total stock across all branches
            $totalStock = $branchAvailability->sum('stock_quantity');
            $totalReserved = $branchAvailability->sum('reserved_quantity');
            $totalAvailable = $totalStock - $totalReserved;

            $product->branch_availability = $branchAvailability;
            $product->total_stock = $totalStock;
            $product->total_reserved = $totalReserved;
            $product->total_available = $totalAvailable;
            $product->stock_status = $totalAvailable > 0 ? 'in_stock' : 'out_of_stock';
            $product->branches_count = $branchAvailability->count();
            
            return $product;
        });

        return response()->json($productsWithAvailability);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        // Staff and Admin can create products
        if (!$user->role || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized to create products. Only Staff and Admin can upload products.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'images' => 'nullable|array|max:4',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max per image
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = $path;
            }
        }

        // Set approval status based on user role
        $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';
        
        DB::beginTransaction();
        try {
            $product = Product::create([
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'stock_quantity' => $request->stock_quantity,
                'is_active' => $request->is_active ?? true,
                'image_paths' => $imagePaths,
                'created_by' => $user->id,
                'created_by_role' => $user->role->value,
                'approval_status' => $approvalStatus,
                'branch_id' => $user->branch_id,
                'sku' => $request->sku ?? 'PROD-' . uniqid(),
                'brand' => $request->brand,
                'model' => $request->model,
                'category_id' => $request->category_id,
            ]);

            // Create branch stock entry for the user's branch
            if ($user->branch_id) {
                $stockQuantity = $request->stock_quantity ?? 0;
                $minThreshold = $request->min_stock_threshold ?? 5;
                
                BranchStock::create([
                    'product_id' => $product->id,
                    'branch_id' => $user->branch_id,
                    'stock_quantity' => $stockQuantity,
                    'reserved_quantity' => 0,
                    'min_stock_threshold' => $minThreshold,
                    'status' => $stockQuantity > $minThreshold ? 'In Stock' : 
                              ($stockQuantity > 0 ? 'Low Stock' : 'Out of Stock'),
                    'price_override' => $request->price_override ?? null,
                    'expiry_date' => $request->expiry_date ?? null,
                    'auto_restock_enabled' => $request->auto_restock_enabled ?? false,
                    'auto_restock_quantity' => $request->auto_restock_quantity ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Product created successfully',
                'product' => $product->load(['creator', 'branchStock'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        $user = Auth::user();

        // Customers can only view active products (if authenticated)
        if ($user && $user->role && $user->role->value === 'customer' && !$product->is_active) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json($product->load('creator'));
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        // Staff can update products they created, Admin can update any product
        if (!$user->role || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized to update products. Only Staff and Admin can update products.'
            ], 403);
        }

        // Staff can only update their own products, Admin can update any product
        if ($user->role->value === 'staff' && $product->created_by_role !== 'staff') {
            return response()->json([
                'message' => 'Staff can only update products they created. Contact Admin for approval.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'is_active' => 'boolean',
            'images' => 'nullable|array|max:4',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Handle image uploads
        if ($request->hasFile('images')) {
            // Delete old images
            if ($product->image_paths) {
                foreach ($product->image_paths as $oldPath) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = $path;
            }
            $data['image_paths'] = $imagePaths;
        }

        $product->update($data);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->load('creator')
        ]);
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy($id): JsonResponse
    {
        $user = Auth::user();
        
        // Find the product manually to debug route model binding issue
        $product = Product::find($id);
        
        if (!$product) {
            \Log::warning('Product not found for deletion', [
                'product_id' => $id,
                'user_id' => $user?->id,
                'user_role' => $user?->role?->value
            ]);
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        }
        
        // Debug logging
        \Log::info('Product deletion attempt', [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'user_id' => $user?->id,
            'user_role' => $user?->role?->value
        ]);

        // Only Admin can delete products (full permissions)
        if (!$user || $user->role->value !== 'admin') {
            \Log::warning('Product deletion unauthorized', [
                'product_id' => $product->id,
                'user_id' => $user?->id,
                'user_role' => $user?->role?->value
            ]);
            return response()->json([
                'message' => 'Unauthorized to delete products. Only Admin can delete products.'
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Check for active reservations
            $activeReservations = $product->reservations()->whereIn('status', ['pending', 'approved'])->count();
            if ($activeReservations > 0) {
                \Log::warning('Product deletion blocked - active reservations', [
                    'product_id' => $product->id,
                    'active_reservations' => $activeReservations
                ]);
                return response()->json([
                    'message' => 'Cannot delete product with active reservations. Please cancel or complete all reservations first.',
                    'active_reservations' => $activeReservations
                ], 422);
            }

            // Check for branch stock records
            $branchStockCount = $product->branchStock()->count();
            if ($branchStockCount > 0) {
                // Delete all branch stock records first
                $product->branchStock()->delete();
                \Log::info('Branch stock records deleted', [
                    'product_id' => $product->id,
                    'branch_stock_count' => $branchStockCount
                ]);
            }

            // Delete associated images
            if ($product->image_paths) {
                foreach ($product->image_paths as $path) {
                    Storage::disk('public')->delete($path);
                }
                \Log::info('Product images deleted', [
                    'product_id' => $product->id,
                    'image_paths' => $product->image_paths
                ]);
            }

            // Delete the product
            $deleted = $product->delete();
            \Log::info('Product deletion executed', [
                'product_id' => $product->id,
                'deleted' => $deleted
            ]);

            DB::commit();
            \Log::info('Product deletion transaction committed', [
                'product_id' => $product->id
            ]);

            return response()->json([
                'message' => 'Product deleted successfully',
                'deleted_branch_stock' => $branchStockCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Product deletion failed', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Approve product changes and manage all products
     */
    public function approveProduct(Product $product): JsonResponse
    {
        $user = Auth::user();

        // Only Admin can approve products
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can approve product changes.'
            ], 403);
        }

        // Activate the product (approve it)
        $product->update(['is_active' => true]);

        return response()->json([
            'message' => 'Product approved and activated successfully',
            'product' => $product->load('creator')
        ]);
    }


    /**
     * Reject a product (Admin only)
     */
    public function rejectProduct(Product $product): JsonResponse
    {
        $user = Auth::user();

        // Only Admin can reject products
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can reject products.'
            ], 403);
        }

        $product->update([
            'approval_status' => 'rejected',
            'is_active' => false
        ]);

        return response()->json([
            'message' => 'Product rejected successfully',
            'product' => $product->load(['creator', 'branch'])
        ]);
    }

    /**
     * Admin: Get all products with management details
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Only Admin can access this endpoint
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can access product management.'
            ], 403);
        }

        $query = Product::with(['creator', 'branch']);

        // Filter by approval status
        if ($request->has('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Filter by creator role
        if ($request->has('created_by_role')) {
            $query->where('created_by_role', $request->created_by_role);
        }

        // Filter by search term
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'products' => $products,
            'total_count' => $products->count(),
            'approved_count' => $products->where('approval_status', 'approved')->count(),
            'pending_count' => $products->where('approval_status', 'pending')->count(),
            'rejected_count' => $products->where('approval_status', 'rejected')->count()
        ]);
    }

    /**
     * Staff: Get products for their branch
     */
    public function staffIndex(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Only Staff can access this endpoint
        if (!$user || $user->role->value !== 'staff') {
            return response()->json([
                'message' => 'Unauthorized. Only Staff can access this endpoint.'
            ], 403);
        }

        if (!$user->branch_id) {
            return response()->json([
                'message' => 'Staff member is not assigned to any branch',
                'products' => []
            ], 200);
        }

        $query = Product::with(['creator', 'branch'])
            ->where('branch_id', $user->branch_id);

        // Filter by approval status
        if ($request->has('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        // Filter by search term
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'products' => $products,
            'total_count' => $products->count(),
            'approved_count' => $products->where('approval_status', 'approved')->count(),
            'pending_count' => $products->where('approval_status', 'pending')->count(),
            'rejected_count' => $products->where('approval_status', 'rejected')->count()
        ]);
    }
}
