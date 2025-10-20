<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ProductCategoryController extends Controller
{
    /**
     * Get all categories
     */
    public function index(): JsonResponse
    {
        try {
            $categories = ProductCategory::all();

            return response()->json([
                'categories' => $categories->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'icon' => $category->icon,
                        'color' => $category->color,
                        'product_count' => 0,
                    ];
                })
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in ProductCategoryController::index: ' . $e->getMessage());
            
            // Return fallback categories if table doesn't exist
            return response()->json([
                'categories' => [
                    [
                        'id' => 1,
                        'name' => 'Eyeglasses',
                        'slug' => 'eyeglasses',
                        'description' => 'Prescription eyeglasses and frames',
                        'icon' => 'glasses',
                        'color' => '#3B82F6',
                        'product_count' => 0,
                    ],
                    [
                        'id' => 2,
                        'name' => 'Contact Lenses',
                        'slug' => 'contact-lenses',
                        'description' => 'Contact lenses and accessories',
                        'icon' => 'eye',
                        'color' => '#10B981',
                        'product_count' => 0,
                    ],
                    [
                        'id' => 3,
                        'name' => 'Sunglasses',
                        'slug' => 'sunglasses',
                        'description' => 'Sunglasses and protective eyewear',
                        'icon' => 'sun',
                        'color' => '#F59E0B',
                        'product_count' => 0,
                    ],
                    [
                        'id' => 4,
                        'name' => 'Accessories',
                        'slug' => 'accessories',
                        'description' => 'Eyewear accessories and cleaning supplies',
                        'icon' => 'tools',
                        'color' => '#8B5CF6',
                        'product_count' => 0,
                    ]
                ]
            ]);
        }
    }

    /**
     * Get a specific category
     */
    public function show(ProductCategory $category): JsonResponse
    {
        return response()->json([
            'category' => $category->formatted_attributes
        ]);
    }

    /**
     * Create a new category (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can create categories.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = ProductCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'icon' => $request->icon,
            'color' => $request->color ?? '#3B82F6',
            'sort_order' => $request->sort_order ?? 0,
        ]);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category->formatted_attributes
        ], 201);
    }

    /**
     * Update a category (Admin only)
     */
    public function update(Request $request, ProductCategory $category): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can update categories.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['description', 'icon', 'color', 'sort_order', 'is_active']);
        
        if ($request->has('name')) {
            $updateData['name'] = $request->name;
            $updateData['slug'] = Str::slug($request->name);
        }

        $category->update($updateData);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category->formatted_attributes
        ]);
    }

    /**
     * Delete a category (Admin only)
     */
    public function destroy(ProductCategory $category): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can delete categories.'
            ], 403);
        }

        // Check if category has products
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing products. Please move or delete products first.'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully'
        ]);
    }

    /**
     * Get products in a category
     */
    public function products(ProductCategory $category, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = $category->products()->with(['creator', 'branch']);

        // Filter by approval status for customers
        if ($user && $user->role && $user->role->value === 'customer') {
            $query->where('is_active', true)
                  ->where('approval_status', 'approved');
        }

        // Filter by search term
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        // Filter by brand
        if ($request->has('brand')) {
            $query->where('brand', $request->brand);
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'category' => $category->formatted_attributes,
            'products' => $products,
            'total_count' => $products->count()
        ]);
    }
}




