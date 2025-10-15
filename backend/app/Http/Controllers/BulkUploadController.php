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

class BulkUploadController extends Controller
{
    /**
     * Handle bulk product upload from folder
     */
    public function uploadFolder(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Admin and Staff can upload products.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'folder' => 'required|file|mimes:zip',
            'category_id' => 'required|exists:product_categories,id',
            'brand' => 'nullable|string|max:255',
            'auto_categorize' => 'boolean',
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

            // Extract ZIP file
            $zipFile = $request->file('folder');
            $extractPath = storage_path('app/temp/bulk_upload_' . time());
            
            $zip = new \ZipArchive();
            if ($zip->open($zipFile->getRealPath()) === TRUE) {
                $zip->extractTo($extractPath);
                $zip->close();
            } else {
                return response()->json([
                    'message' => 'Failed to extract ZIP file'
                ], 422);
            }

            // Process extracted files
            $files = $this->getImageFiles($extractPath);
            
            foreach ($files as $file) {
                try {
                    $productData = $this->extractProductData($file, $request);
                    $product = $this->createProduct($productData, $user);
                    $uploadedProducts[] = $product;
                } catch (\Exception $e) {
                    $errors[] = [
                        'file' => basename($file),
                        'error' => $e->getMessage()
                    ];
                }
            }

            // Clean up temp files
            $this->cleanupTempFiles($extractPath);

            return response()->json([
                'message' => 'Bulk upload completed',
                'uploaded_count' => count($uploadedProducts),
                'error_count' => count($errors),
                'products' => $uploadedProducts,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Bulk upload failed: ' . $e->getMessage()
            ], 500);
        }
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
     * Extract product data from file
     */
    private function extractProductData(string $filePath, Request $request): array
    {
        $fileName = pathinfo($filePath, PATHINFO_FILENAME);
        $fileName = str_replace(['_', '-'], ' ', $fileName);
        
        // Try to extract brand and model from filename
        $parts = explode(' ', $fileName);
        $brand = $request->brand ?? $parts[0] ?? 'Unknown';
        $model = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : $fileName;

        return [
            'name' => $fileName,
            'brand' => $brand,
            'model' => $model,
            'file_path' => $filePath,
            'category_id' => $request->category_id,
            'auto_categorize' => $request->boolean('auto_categorize', false),
        ];
    }

    /**
     * Create product from extracted data
     */
    private function createProduct(array $data, $user): Product
    {
        // Process and store image
        $imagePath = $this->processImage($data['file_path']);
        
        // Set approval status based on user role
        $approvalStatus = $user->role->value === 'admin' ? 'approved' : 'pending';

        $product = Product::create([
            'name' => $data['name'],
            'description' => "Product uploaded via bulk upload",
            'price' => 0, // Will need to be set manually
            'stock_quantity' => 0, // Will need to be set manually
            'is_active' => true,
            'image_paths' => [$imagePath],
            'primary_image' => $imagePath,
            'created_by' => $user->id,
            'created_by_role' => $user->role->value,
            'approval_status' => $approvalStatus,
            'branch_id' => $user->branch_id,
            'category_id' => $data['category_id'],
            'brand' => $data['brand'],
            'model' => $data['model'],
            'sku' => $this->generateSku($data['brand'], $data['model']),
            'attributes' => [
                'upload_method' => 'bulk_upload',
                'original_filename' => basename($data['file_path']),
            ],
        ]);

        return $product;
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
        $filename = 'bulk_' . time() . '_' . Str::random(10) . '.jpg';
        $path = 'products/' . $filename;

        // Save to storage
        $image->encode('jpg', 85)->save(storage_path('app/public/' . $path));

        return $path;
    }

    /**
     * Generate SKU from brand and model
     */
    private function generateSku(string $brand, string $model): string
    {
        $brandCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $brand), 0, 3));
        $modelCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $model), 0, 4));
        $random = strtoupper(Str::random(3));
        
        return $brandCode . '-' . $modelCode . '-' . $random;
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

    /**
     * Get upload progress (for large uploads)
     */
    public function getProgress(Request $request): JsonResponse
    {
        $sessionId = $request->get('session_id');
        
        // This would be implemented with Redis or database for real-time progress
        // For now, return a simple response
        return response()->json([
            'progress' => 0,
            'status' => 'processing'
        ]);
    }
}




