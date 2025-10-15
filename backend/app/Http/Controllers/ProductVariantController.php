<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProductVariantController extends Controller
{
    /**
     * Create a product with color variants
     */
    public function createWithVariants(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Admin and Staff can create products.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'color_variants' => 'required|json',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Parse color variants data
            $colorVariantsData = json_decode($request->color_variants, true);
            
            if (!is_array($colorVariantsData) || empty($colorVariantsData)) {
                return response()->json([
                    'message' => 'Invalid color variants data'
                ], 422);
            }

            // Get category
            $category = ProductCategory::where('name', $request->category)->first();
            if (!$category) {
                // Create category if it doesn't exist
                $category = ProductCategory::create([
                    'name' => $request->category,
                    'slug' => Str::slug($request->category),
                    'description' => "Auto-created category for {$request->category}",
                ]);
            }

            // Process and upload all images
            $uploadedImages = [];
            $images = $request->file('images');
            
            if (!$images || !is_array($images)) {
                return response()->json([
                    'message' => 'No images provided'
                ], 422);
            }

            foreach ($images as $index => $image) {
                $imagePath = $this->processAndStoreImage($image);
                
                $uploadedImages[] = [
                    'path' => $imagePath,
                    'color' => $request->input("image_color_{$index}"),
                    'is_primary' => $request->input("image_is_primary_{$index}") === 'true',
                    'variant_index' => $request->input("image_variant_index_{$index}"),
                ];
            }

            // Group images by color variant
            $colorVariants = [];
            foreach ($colorVariantsData as $variantIndex => $variantData) {
                $variantImages = array_filter($uploadedImages, function($img) use ($variantIndex) {
                    return (int)$img['variant_index'] === $variantIndex;
                });

                $imagePaths = array_column($variantImages, 'path');
                $primaryImage = null;
                
                foreach ($variantImages as $img) {
                    if ($img['is_primary']) {
                        $primaryImage = $img['path'];
                        break;
                    }
                }
                
                if (!$primaryImage && !empty($imagePaths)) {
                    $primaryImage = $imagePaths[0];
                }

                $colorVariants[] = [
                    'color' => $variantData['color'],
                    'image_paths' => $imagePaths,
                    'primary_image' => $primaryImage,
                ];
            }

            // Set approval status based on user role
            $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';

            // Get overall primary image (from first color variant)
            $overallPrimaryImage = !empty($colorVariants) ? $colorVariants[0]['primary_image'] : null;
            
            // Get all image paths
            $allImagePaths = [];
            foreach ($colorVariants as $variant) {
                $allImagePaths = array_merge($allImagePaths, $variant['image_paths']);
            }

            // Create the product
            $product = Product::create([
                'name' => $request->name,
                'description' => $request->description ?? "Available in " . count($colorVariants) . " colors",
                'price' => $request->price ?? 0,
                'stock_quantity' => $request->stock_quantity ?? 0,
                'is_active' => true,
                'image_paths' => $allImagePaths,
                'primary_image' => $overallPrimaryImage,
                'created_by' => $user->id,
                'created_by_role' => $user->role->value,
                'approval_status' => $approvalStatus,
                'branch_id' => $user->branch_id,
                'category_id' => $category->id,
                'brand' => $request->brand,
                'model' => $request->name,
                'sku' => $this->generateSKU($request->brand, $request->name),
                'attributes' => [
                    'has_color_variants' => true,
                    'color_variants' => $colorVariants,
                ],
            ]);

            return response()->json([
                'message' => 'Product with color variants created successfully',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'category' => $request->category,
                    'color_variants' => count($colorVariants),
                    'total_images' => count($allImagePaths),
                    'approval_status' => $approvalStatus,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create product: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process and store an image
     */
    private function processAndStoreImage($imageFile): string
    {
        // Generate unique filename
        $filename = 'product_' . time() . '_' . Str::random(10) . '.' . $imageFile->getClientOriginalExtension();
        
        // Store the file directly using Laravel's built-in storage
        // This stores in storage/app/public/products/
        $storedPath = $imageFile->storeAs('public/products', $filename);
        
        // Return the path without 'public/' prefix for URL generation
        // Frontend will add /storage/ to make: /storage/products/filename.jpg
        return 'products/' . $filename;
    }

    /**
     * Generate SKU
     */
    private function generateSKU(string $brand, string $name): string
    {
        $brandCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $brand), 0, 3));
        $nameCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $name), 0, 4));
        $random = strtoupper(Str::random(4));
        
        return "{$brandCode}-{$nameCode}-{$random}";
    }
}

