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
use Intervention\Image\Facades\Image;

class IntelligentBulkUploadController extends Controller
{
    /**
     * Handle intelligent bulk product upload from organized folder structure
     */
    public function uploadOrganizedFolder(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Admin and Staff can upload products.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'folder' => 'required|file|mimes:zip',
            'auto_categorize' => 'boolean',
            'default_price' => 'nullable|numeric|min:0',
            'default_stock' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $uploadedProducts = [];
            $errors = [];
            $categories = [];

            // Extract ZIP file
            $zipFile = $request->file('folder');
            $extractPath = storage_path('app/temp/intelligent_upload_' . time());
            
            $zip = new \ZipArchive();
            if ($zip->open($zipFile->getRealPath()) === TRUE) {
                $zip->extractTo($extractPath);
                $zip->close();
            } else {
                return response()->json([
                    'message' => 'Failed to extract ZIP file'
                ], 422);
            }

            // Process the organized folder structure
            $results = $this->processOrganizedStructure($extractPath, $user, $request);
            
            // Clean up temp files
            $this->cleanupTempFiles($extractPath);

            return response()->json([
                'message' => 'Intelligent bulk upload completed',
                'uploaded_count' => $results['uploaded_count'],
                'error_count' => $results['error_count'],
                'categories_created' => $results['categories_created'],
                'products' => $results['products'],
                'errors' => $results['errors'],
                'summary' => $results['summary']
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Bulk upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process the organized folder structure
     */
    private function processOrganizedStructure(string $path, $user, Request $request): array
    {
        $uploadedProducts = [];
        $errors = [];
        $categoriesCreated = [];
        $summary = [
            'branded_frames' => 0,
            'non_branded_frames' => 0,
            'contact_lenses' => 0,
            'solutions' => 0,
            'sunglasses' => 0,
        ];

        // Process Branded frames
        $brandedPath = $path . '/Branded';
        if (is_dir($brandedPath)) {
            $result = $this->processBrandedFrames($brandedPath, $user, $request);
            $uploadedProducts = array_merge($uploadedProducts, $result['products']);
            $errors = array_merge($errors, $result['errors']);
            $summary['branded_frames'] = $result['count'];
        }

        // Process Non-Branded frames
        $nonBrandedPath = $path . '/Non-Branded';
        if (is_dir($nonBrandedPath)) {
            $result = $this->processNonBrandedFrames($nonBrandedPath, $user, $request);
            $uploadedProducts = array_merge($uploadedProducts, $result['products']);
            $errors = array_merge($errors, $result['errors']);
            $summary['non_branded_frames'] = $result['count'];
        }

        // Process Contact Lenses
        $contactLensPath = $path . '/Contact Lenses';
        if (is_dir($contactLensPath)) {
            $result = $this->processContactLenses($contactLensPath, $user, $request);
            $uploadedProducts = array_merge($uploadedProducts, $result['products']);
            $errors = array_merge($errors, $result['errors']);
            $summary['contact_lenses'] = $result['count'];
        }

        // Process Solutions
        $solutionPath = $path . '/Solution';
        if (is_dir($solutionPath)) {
            $result = $this->processSolutions($solutionPath, $user, $request);
            $uploadedProducts = array_merge($uploadedProducts, $result['products']);
            $errors = array_merge($errors, $result['errors']);
            $summary['solutions'] = $result['count'];
        }

        // Process Sunglasses
        $sunglassesPath = $path . '/SUNGLASSES';
        if (is_dir($sunglassesPath)) {
            $result = $this->processSunglasses($sunglassesPath, $user, $request);
            $uploadedProducts = array_merge($uploadedProducts, $result['products']);
            $errors = array_merge($errors, $result['errors']);
            $summary['sunglasses'] = $result['count'];
        }

        return [
            'uploaded_count' => count($uploadedProducts),
            'error_count' => count($errors),
            'categories_created' => $categoriesCreated,
            'products' => $uploadedProducts,
            'errors' => $errors,
            'summary' => $summary
        ];
    }

    /**
     * Process branded frames (Brand/Brand/Shape/Color structure)
     */
    private function processBrandedFrames(string $path, $user, Request $request): array
    {
        $products = [];
        $errors = [];
        $count = 0;

        $brandDirs = array_filter(scandir($path), function($item) use ($path) {
            return is_dir($path . '/' . $item) && !in_array($item, ['.', '..']);
        });

        foreach ($brandDirs as $brand) {
            $brandPath = $path . '/' . $brand;
            $shapeDirs = array_filter(scandir($brandPath), function($item) use ($brandPath) {
                return is_dir($brandPath . '/' . $item) && !in_array($item, ['.', '..']);
            });

            foreach ($shapeDirs as $shape) {
                $shapePath = $brandPath . '/' . $shape;
                $colorDirs = array_filter(scandir($shapePath), function($item) use ($shapePath) {
                    return is_dir($shapePath . '/' . $item) && !in_array($item, ['.', '..']);
                });

                foreach ($colorDirs as $color) {
                    $colorPath = $shapePath . '/' . $color;
                    $images = $this->getImageFiles($colorPath);

                    foreach ($images as $imagePath) {
                        try {
                            $product = $this->createBrandedFrameProduct($imagePath, $brand, $shape, $color, $user, $request);
                            $products[] = $product;
                            $count++;
                        } catch (\Exception $e) {
                            $errors[] = [
                                'file' => basename($imagePath),
                                'error' => $e->getMessage()
                            ];
                        }
                    }
                }
            }
        }

        return ['products' => $products, 'errors' => $errors, 'count' => $count];
    }

    /**
     * Process non-branded frames (Shape/Color structure)
     */
    private function processNonBrandedFrames(string $path, $user, Request $request): array
    {
        $products = [];
        $errors = [];
        $count = 0;

        $shapeDirs = array_filter(scandir($path), function($item) use ($path) {
            return is_dir($path . '/' . $item) && !in_array($item, ['.', '..']);
        });

        foreach ($shapeDirs as $shape) {
            $shapePath = $path . '/' . $shape;
            $colorDirs = array_filter(scandir($shapePath), function($item) use ($shapePath) {
                return is_dir($shapePath . '/' . $item) && !in_array($item, ['.', '..']);
            });

            foreach ($colorDirs as $color) {
                $colorPath = $shapePath . '/' . $color;
                $images = $this->getImageFiles($colorPath);

                foreach ($images as $imagePath) {
                    try {
                        $product = $this->createNonBrandedFrameProduct($imagePath, $shape, $color, $user, $request);
                        $products[] = $product;
                        $count++;
                    } catch (\Exception $e) {
                        $errors[] = [
                            'file' => basename($imagePath),
                            'error' => $e->getMessage()
                        ];
                    }
                }
            }
        }

        return ['products' => $products, 'errors' => $errors, 'count' => $count];
    }

    /**
     * Process contact lenses
     */
    private function processContactLenses(string $path, $user, Request $request): array
    {
        $products = [];
        $errors = [];
        $count = 0;

        $images = $this->getImageFiles($path);
        foreach ($images as $imagePath) {
            try {
                $product = $this->createContactLensProduct($imagePath, $user, $request);
                $products[] = $product;
                $count++;
            } catch (\Exception $e) {
                $errors[] = [
                    'file' => basename($imagePath),
                    'error' => $e->getMessage()
                ];
            }
        }

        return ['products' => $products, 'errors' => $errors, 'count' => $count];
    }

    /**
     * Process solutions
     */
    private function processSolutions(string $path, $user, Request $request): array
    {
        $products = [];
        $errors = [];
        $count = 0;

        $images = $this->getImageFiles($path);
        foreach ($images as $imagePath) {
            try {
                $product = $this->createSolutionProduct($imagePath, $user, $request);
                $products[] = $product;
                $count++;
            } catch (\Exception $e) {
                $errors[] = [
                    'file' => basename($imagePath),
                    'error' => $e->getMessage()
                ];
            }
        }

        return ['products' => $products, 'errors' => $errors, 'count' => $count];
    }

    /**
     * Process sunglasses
     */
    private function processSunglasses(string $path, $user, Request $request): array
    {
        $products = [];
        $errors = [];
        $count = 0;

        // Process branded sunglasses
        $brandedPath = $path . '/BRANDED';
        if (is_dir($brandedPath)) {
            $result = $this->processBrandedFrames($brandedPath, $user, $request);
            $products = array_merge($products, $result['products']);
            $errors = array_merge($errors, $result['errors']);
            $count += $result['count'];
        }

        // Process non-branded sunglasses
        $nonBrandedPath = $path . '/NON-BRANDED';
        if (is_dir($nonBrandedPath)) {
            $images = $this->getImageFiles($nonBrandedPath);
            foreach ($images as $imagePath) {
                try {
                    $product = $this->createSunglassProduct($imagePath, $user, $request);
                    $products[] = $product;
                    $count++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'file' => basename($imagePath),
                        'error' => $e->getMessage()
                    ];
                }
            }
        }

        return ['products' => $products, 'errors' => $errors, 'count' => $count];
    }

    /**
     * Create branded frame product
     */
    private function createBrandedFrameProduct(string $imagePath, string $brand, string $shape, string $color, $user, Request $request): Product
    {
        $imagePath = $this->processImage($imagePath);
        $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';
        
        $name = "{$brand} {$shape} {$color}";
        $sku = $this->generateSku($brand, $shape, $color);

        return Product::create([
            'name' => $name,
            'description' => "{$brand} {$shape} frame in {$color}",
            'price' => $request->default_price ?? 0,
            'stock_quantity' => $request->default_stock ?? 0,
            'is_active' => true,
            'image_paths' => [$imagePath],
            'primary_image' => $imagePath,
            'created_by' => $user->id,
            'created_by_role' => $user->role->value,
            'approval_status' => $approvalStatus,
            'branch_id' => $user->branch_id,
            'category_id' => $this->getCategoryId('Frames'),
            'brand' => $brand,
            'model' => "{$shape} {$color}",
            'sku' => $sku,
            'attributes' => [
                'type' => 'branded_frame',
                'shape' => $shape,
                'color' => $color,
                'original_filename' => basename($imagePath),
            ],
        ]);
    }

    /**
     * Create non-branded frame product
     */
    private function createNonBrandedFrameProduct(string $imagePath, string $shape, string $color, $user, Request $request): Product
    {
        $imagePath = $this->processImage($imagePath);
        $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';
        
        $name = "Non-Branded {$shape} {$color}";
        $sku = $this->generateSku('NB', $shape, $color);

        return Product::create([
            'name' => $name,
            'description' => "Non-branded {$shape} frame in {$color}",
            'price' => $request->default_price ?? 0,
            'stock_quantity' => $request->default_stock ?? 0,
            'is_active' => true,
            'image_paths' => [$imagePath],
            'primary_image' => $imagePath,
            'created_by' => $user->id,
            'created_by_role' => $user->role->value,
            'approval_status' => $approvalStatus,
            'branch_id' => $user->branch_id,
            'category_id' => $this->getCategoryId('Frames'),
            'brand' => 'Non-Branded',
            'model' => "{$shape} {$color}",
            'sku' => $sku,
            'attributes' => [
                'type' => 'non_branded_frame',
                'shape' => $shape,
                'color' => $color,
                'original_filename' => basename($imagePath),
            ],
        ]);
    }

    /**
     * Create contact lens product
     */
    private function createContactLensProduct(string $imagePath, $user, Request $request): Product
    {
        $imagePath = $this->processImage($imagePath);
        $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';
        
        $filename = basename($imagePath, '.jpg');
        $name = "Contact Lens {$filename}";
        $sku = $this->generateSku('CL', $filename, '');

        return Product::create([
            'name' => $name,
            'description' => "Contact lens product {$filename}",
            'price' => $request->default_price ?? 0,
            'stock_quantity' => $request->default_stock ?? 0,
            'is_active' => true,
            'image_paths' => [$imagePath],
            'primary_image' => $imagePath,
            'created_by' => $user->id,
            'created_by_role' => $user->role->value,
            'approval_status' => $approvalStatus,
            'branch_id' => $user->branch_id,
            'category_id' => $this->getCategoryId('Contact Lenses'),
            'brand' => 'Generic',
            'model' => $filename,
            'sku' => $sku,
            'attributes' => [
                'type' => 'contact_lens',
                'original_filename' => basename($imagePath),
            ],
        ]);
    }

    /**
     * Create solution product
     */
    private function createSolutionProduct(string $imagePath, $user, Request $request): Product
    {
        $imagePath = $this->processImage($imagePath);
        $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';
        
        $filename = basename($imagePath, '.jpg');
        $name = "Solution {$filename}";
        $sku = $this->generateSku('SOL', $filename, '');

        return Product::create([
            'name' => $name,
            'description' => "Contact lens solution {$filename}",
            'price' => $request->default_price ?? 0,
            'stock_quantity' => $request->default_stock ?? 0,
            'is_active' => true,
            'image_paths' => [$imagePath],
            'primary_image' => $imagePath,
            'created_by' => $user->id,
            'created_by_role' => $user->role->value,
            'approval_status' => $approvalStatus,
            'branch_id' => $user->branch_id,
            'category_id' => $this->getCategoryId('Lens Accessories'),
            'brand' => 'Generic',
            'model' => $filename,
            'sku' => $sku,
            'attributes' => [
                'type' => 'solution',
                'original_filename' => basename($imagePath),
            ],
        ]);
    }

    /**
     * Create sunglass product
     */
    private function createSunglassProduct(string $imagePath, $user, Request $request): Product
    {
        $imagePath = $this->processImage($imagePath);
        $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';
        
        $filename = basename($imagePath, '.jpg');
        $name = "Sunglass {$filename}";
        $sku = $this->generateSku('SG', $filename, '');

        return Product::create([
            'name' => $name,
            'description' => "Sunglass product {$filename}",
            'price' => $request->default_price ?? 0,
            'stock_quantity' => $request->default_stock ?? 0,
            'is_active' => true,
            'image_paths' => [$imagePath],
            'primary_image' => $imagePath,
            'created_by' => $user->id,
            'created_by_role' => $user->role->value,
            'approval_status' => $approvalStatus,
            'branch_id' => $user->branch_id,
            'category_id' => $this->getCategoryId('Sunglasses'),
            'brand' => 'Generic',
            'model' => $filename,
            'sku' => $sku,
            'attributes' => [
                'type' => 'sunglass',
                'original_filename' => basename($imagePath),
            ],
        ]);
    }

    /**
     * Get category ID by name
     */
    private function getCategoryId(string $categoryName): ?int
    {
        $category = ProductCategory::where('name', $categoryName)->first();
        return $category ? $category->id : null;
    }

    /**
     * Get all image files from directory
     */
    private function getImageFiles(string $path): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $this->isImageFile($file->getPathname())) {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    /**
     * Check if file is an image
     */
    private function isImageFile(string $filePath): bool
    {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        return in_array($extension, $allowedExtensions);
    }

    /**
     * Process and store image
     */
    private function processImage(string $filePath): string
    {
        $image = Image::make($filePath);
        
        // Resize if too large
        if ($image->width() > 1920 || $image->height() > 1920) {
            $image->resize(1920, 1920, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        // Generate unique filename
        $filename = 'intelligent_' . time() . '_' . Str::random(10) . '.jpg';
        $path = 'products/' . $filename;

        // Save to storage
        $image->encode('jpg', 85)->save(storage_path('app/public/' . $path));

        return $path;
    }

    /**
     * Generate SKU from components
     */
    private function generateSku(string $brand, string $model, string $color): string
    {
        $brandCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $brand), 0, 3));
        $modelCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $model), 0, 4));
        $colorCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $color), 0, 2));
        $random = strtoupper(Str::random(3));
        
        return $brandCode . '-' . $modelCode . ($colorCode ? '-' . $colorCode : '') . '-' . $random;
    }

    /**
     * Clean up temporary files
     */
    private function cleanupTempFiles(string $path): void
    {
        if (is_dir($path)) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::CHILD_FIRST
            );

            foreach ($files as $file) {
                if ($file->isDir()) {
                    rmdir($file->getRealPath());
                } else {
                    unlink($file->getRealPath());
                }
            }

            rmdir($path);
        }
    }
}




