<?php

namespace App\Http\Controllers;

use App\Models\Product;
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
        
        // Filter by active status for customers
        if ($user && $user->role && $user->role->value === 'customer') {
            $query->where('is_active', true);
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
                    'branch' => [
                        'id' => $stock->branch_id,
                        'name' => $stock->branch_name,
                        'code' => $stock->branch_code,
                    ],
                    'available_quantity' => $stock->stock_quantity - ($stock->reserved_quantity ?? 0),
                    'stock_quantity' => $stock->stock_quantity,
                    'reserved_quantity' => $stock->reserved_quantity ?? 0,
                    'is_available' => ($stock->stock_quantity - ($stock->reserved_quantity ?? 0)) > 0,
                ];
            });

            $product->branch_availability = $branchAvailability;
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

        $product = Product::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock_quantity' => $request->stock_quantity,
            'is_active' => $request->is_active ?? true,
            'image_paths' => $imagePaths,
            'created_by' => $user->id,
            'created_by_role' => $user->role->value,
        ]);

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product->load('creator')
        ], 201);
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
    public function destroy(Product $product): JsonResponse
    {
        $user = Auth::user();

        // Only Admin can delete products (full permissions)
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized to delete products. Only Admin can delete products.'
            ], 403);
        }

        // Delete associated images
        if ($product->image_paths) {
            foreach ($product->image_paths as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
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

        $query = Product::with('creator');

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
            'active_count' => $products->where('is_active', true)->count(),
            'pending_count' => $products->where('is_active', false)->count()
        ]);
    }
}
