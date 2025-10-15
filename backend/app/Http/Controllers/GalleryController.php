<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\BranchStock;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GalleryController extends Controller
{
    /**
     * Get all products available in a specific branch
     * 
     * @param int $branchId
     * @return JsonResponse
     */
    public function getBranchProducts(int $branchId): JsonResponse
    {
        // Verify branch exists
        $branch = Branch::find($branchId);
        if (!$branch) {
            return response()->json([
                'error' => 'Branch not found'
            ], 404);
        }

        // Get products with their branch stock information
        $products = Product::with(['branchStock' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0); // Only products with stock > 0
            }])
            ->where('is_active', true) // Only active products
            ->where('approval_status', 'approved') // Only approved products
            ->whereHas('branchStock', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0);
            })
            ->get()
            ->map(function ($product) use ($branchId, $branch) {
                $branchStock = $product->branchStock->first();
                
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'category' => $product->category ? $product->category->name : null,
                    'sku' => $product->sku,
                    'image' => $product->primary_image_path ?? ($product->image_paths[0] ?? null),
                    'price' => $branchStock ? $branchStock->effective_price : $product->price,
                    'stock' => $branchStock ? $branchStock->available_quantity : 0,
                    'status' => $branchStock ? $branchStock->status : 'Out of Stock',
                    'branch' => $branch->name,
                    'description' => $product->description,
                    'expiry_date' => $branchStock ? $branchStock->expiry_date : null,
                ];
            });

        return response()->json($products);
    }

    /**
     * Get products by category in a specific branch
     * 
     * @param int $branchId
     * @param int $categoryId
     * @return JsonResponse
     */
    public function getBranchProductsByCategory(int $branchId, int $categoryId): JsonResponse
    {
        // Verify branch exists
        $branch = Branch::find($branchId);
        if (!$branch) {
            return response()->json([
                'error' => 'Branch not found'
            ], 404);
        }

        // Get products by category with their branch stock information
        $products = Product::with(['branchStock' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0);
            }])
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->where('category_id', $categoryId)
            ->whereHas('branchStock', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0);
            })
            ->get()
            ->map(function ($product) use ($branchId, $branch) {
                $branchStock = $product->branchStock->first();
                
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'category' => $product->category ? $product->category->name : null,
                    'sku' => $product->sku,
                    'image' => $product->primary_image_path ?? ($product->image_paths[0] ?? null),
                    'price' => $branchStock ? $branchStock->effective_price : $product->price,
                    'stock' => $branchStock ? $branchStock->available_quantity : 0,
                    'status' => $branchStock ? $branchStock->status : 'Out of Stock',
                    'branch' => $branch->name,
                    'description' => $product->description,
                    'expiry_date' => $branchStock ? $branchStock->expiry_date : null,
                ];
            });

        return response()->json($products);
    }

    /**
     * Get products by brand in a specific branch
     * 
     * @param int $branchId
     * @param string $brand
     * @return JsonResponse
     */
    public function getBranchProductsByBrand(int $branchId, string $brand): JsonResponse
    {
        // Verify branch exists
        $branch = Branch::find($branchId);
        if (!$branch) {
            return response()->json([
                'error' => 'Branch not found'
            ], 404);
        }

        // Get products by brand with their branch stock information
        $products = Product::with(['branchStock' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0);
            }])
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->where('brand', $brand)
            ->whereHas('branchStock', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0);
            })
            ->get()
            ->map(function ($product) use ($branchId, $branch) {
                $branchStock = $product->branchStock->first();
                
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'category' => $product->category ? $product->category->name : null,
                    'sku' => $product->sku,
                    'image' => $product->primary_image_path ?? ($product->image_paths[0] ?? null),
                    'price' => $branchStock ? $branchStock->effective_price : $product->price,
                    'stock' => $branchStock ? $branchStock->available_quantity : 0,
                    'status' => $branchStock ? $branchStock->status : 'Out of Stock',
                    'branch' => $branch->name,
                    'description' => $product->description,
                    'expiry_date' => $branchStock ? $branchStock->expiry_date : null,
                ];
            });

        return response()->json($products);
    }

    /**
     * Search products in a specific branch
     * 
     * @param int $branchId
     * @param Request $request
     * @return JsonResponse
     */
    public function searchBranchProducts(int $branchId, Request $request): JsonResponse
    {
        // Verify branch exists
        $branch = Branch::find($branchId);
        if (!$branch) {
            return response()->json([
                'error' => 'Branch not found'
            ], 404);
        }

        $searchTerm = $request->get('q', '');
        
        if (empty($searchTerm)) {
            return response()->json([
                'error' => 'Search term is required'
            ], 400);
        }

        // Search products with their branch stock information
        $products = Product::with(['branchStock' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0);
            }])
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->where(function ($query) use ($searchTerm) {
                $query->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('brand', 'like', "%{$searchTerm}%")
                      ->orWhere('sku', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%");
            })
            ->whereHas('branchStock', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->where('stock_quantity', '>', 0);
            })
            ->get()
            ->map(function ($product) use ($branchId, $branch) {
                $branchStock = $product->branchStock->first();
                
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'category' => $product->category ? $product->category->name : null,
                    'sku' => $product->sku,
                    'image' => $product->primary_image_path ?? ($product->image_paths[0] ?? null),
                    'price' => $branchStock ? $branchStock->effective_price : $product->price,
                    'stock' => $branchStock ? $branchStock->available_quantity : 0,
                    'status' => $branchStock ? $branchStock->status : 'Out of Stock',
                    'branch' => $branch->name,
                    'description' => $product->description,
                    'expiry_date' => $branchStock ? $branchStock->expiry_date : null,
                ];
            });

        return response()->json($products);
    }
}