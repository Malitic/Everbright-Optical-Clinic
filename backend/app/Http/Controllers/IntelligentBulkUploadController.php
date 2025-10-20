<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use ZipArchive;
use Illuminate\Support\Facades\DB;

use App\Models\Product;

class IntelligentBulkUploadController extends Controller
{
    /**
     * Handle intelligent bulk upload from a ZIP containing product images.
     * Groups images by top-level folder (product), detects simple type by name,
     * and creates products with image_paths.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'folder' => 'required|file|mimes:zip',
            'default_price' => 'nullable|numeric|min:0',
            'default_stock' => 'nullable|integer|min:0',
            'auto_categorize' => 'nullable|boolean',
        ]);

        // Allow long-running bulk uploads
        @set_time_limit(0);
        $zipFile = $request->file('folder');
        $defaultPrice = (float) ($request->input('default_price', 0));
        $defaultStock = (int) ($request->input('default_stock', 0));
        $maxProducts = (int) ($request->input('max_products', 0)); // optional cap for faster runs

        $tmpDir = storage_path('app/tmp/intelligent_upload_' . Str::uuid());
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0775, true);
        }

        $zipPath = $tmpDir . '/upload.zip';
        $zipFile->move($tmpDir, 'upload.zip');

        $zip = new ZipArchive();
        $openRes = $zip->open($zipPath);
        if ($openRes !== true) {
            return response()->json([
                'message' => 'Failed to open ZIP archive',
            ], 422);
        }

        $extractDir = $tmpDir . '/extract';
        mkdir($extractDir, 0775, true);
        $zip->extractTo($extractDir);
        $zip->close();

        // Collect images grouped by top-level directory
        $allowedExt = ['jpg','jpeg','png','gif','webp'];
        $grouped = [];

        $rii = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($extractDir));
        foreach ($rii as $file) {
            if ($file->isDir()) continue;
            $ext = strtolower(pathinfo($file->getFilename(), PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExt)) continue;

            $fullPath = $file->getPathname();
            // Determine top-level folder name relative to extract dir
            $relativePath = str_replace($extractDir . DIRECTORY_SEPARATOR, '', $fullPath);
            $parts = preg_split('/\\\\|\//', $relativePath);
            $top = count($parts) > 1 ? $parts[0] : pathinfo($parts[0], PATHINFO_FILENAME);
            if (!isset($grouped[$top])) $grouped[$top] = [];
            $grouped[$top][] = $fullPath;
        }

        $uploadedCount = 0;
        $errors = [];
        $createdProducts = [];
        $summary = [
            'branded_frames' => 0,
            'non_branded_frames' => 0,
            'contact_lenses' => 0,
            'solutions' => 0,
            'sunglasses' => 0,
        ];

        $allGroups = array_keys($grouped);
        if ($maxProducts > 0) {
            $allGroups = array_slice($allGroups, 0, $maxProducts);
        }

        DB::beginTransaction();
        try {
        foreach ($allGroups as $folderName) {
            $imageFiles = $grouped[$folderName];
            try {
                // Normalize folder name for simple inference
                $normalized = strtolower(str_replace(['_', '-', '\\', '/'], ' ', $folderName));

                // Simple type inference
                $inferredCategory = 'Frames';
                $inferredBrand = $this->inferBrandFromText($normalized);
                $inferredShape = $this->inferShapeFromText($normalized);
                $inferredColor = $this->inferColorFromText($normalized);
                if (str_contains($normalized, 'contact')) {
                    $inferredCategory = 'Contact Lenses';
                    $summary['contact_lenses']++;
                } elseif (str_contains($normalized, 'solution') || str_contains($normalized, 'care')) {
                    $inferredCategory = 'Eye Care Products';
                    $summary['solutions']++;
                } elseif (str_contains($normalized, 'sun') || str_contains($normalized, 'sunglass')) {
                    $inferredCategory = 'Sunglasses';
                    $summary['sunglasses']++;
                } else {
                    // Split branded vs non-branded heuristic (contains brand-like token)
                    if (preg_match('/\b(rayban|oakley|gucci|prada|nike|adidas|puma|levis|fendi|dior)\b/i', $folderName)) {
                        $summary['branded_frames']++;
                    } else {
                        $summary['non_branded_frames']++;
                    }
                }

                // Choose primary image: prefer names containing 'front' or '01'
                usort($imageFiles, function($a, $b) {
                    $an = strtolower(basename($a));
                    $bn = strtolower(basename($b));
                    $as = (str_contains($an, 'front') || preg_match('/(^|[^\d])0?1(?!\d)/', $an)) ? 0 : 1;
                    $bs = (str_contains($bn, 'front') || preg_match('/(^|[^\d])0?1(?!\d)/', $bn)) ? 0 : 1;
                    return $as <=> $bs;
                });

                // Store images under public/products/{slug}/ using fast move when possible
                $slug = Str::slug($folderName);
                $storedPaths = [];
                foreach ($imageFiles as $idx => $full) {
                    $ext = pathinfo($full, PATHINFO_EXTENSION);
                    $targetName = $slug . '_' . str_pad((string)($idx+1), 2, '0', STR_PAD_LEFT) . '.' . $ext;
                    $publicDir = storage_path('app/public/products/' . $slug);
                    if (!is_dir($publicDir)) @mkdir($publicDir, 0775, true);
                    $destPath = $publicDir . DIRECTORY_SEPARATOR . $targetName;
                    // Prefer move (same disk) for speed; fallback to copy
                    $moved = @rename($full, $destPath);
                    if (!$moved) {
                        $moved = @copy($full, $destPath);
                    }
                    if (!$moved) {
                        throw new \RuntimeException('Failed to store image: ' . $full);
                    }
                    $storedPaths[] = 'products/' . $slug . '/' . $targetName;
                }

                // Create product record
                $product = Product::create([
                    'name' => trim($folderName),
                    'description' => ucfirst($inferredCategory) . ' uploaded via Intelligent Bulk Upload',
                    'price' => $defaultPrice,
                    'stock_quantity' => $defaultStock,
                    'is_active' => true,
                    'image_paths' => $storedPaths,
                    'primary_image' => $storedPaths[0] ?? null,
                    'created_by' => optional($request->user())->id,
                    'created_by_role' => optional($request->user())->role->value ?? null,
                    'approval_status' => 'approved',
                    'category_id' => $this->getCategoryId($inferredCategory),
                    'brand' => $inferredBrand,
                    'model' => trim(($inferredShape ? ucfirst($inferredShape) . ' ' : '') . ($inferredColor ? ucfirst($inferredColor) : '')),
                    'attributes' => [
                        'shape' => $inferredShape,
                        'color' => $inferredColor,
                        'source' => 'intelligent_bulk_upload',
                    ],
                ]);

                $uploadedCount++;
                $createdProducts[] = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku ?? null,
                    'brand' => $product->brand ?? null,
                    'category' => [ 'name' => $inferredCategory ],
                ];
            } catch (\Throwable $e) {
                Log::error('Intelligent upload error', [ 'folder' => $folderName, 'error' => $e->getMessage() ]);
                $errors[] = [ 'file' => $folderName, 'error' => $e->getMessage() ];
            }
        }
        DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        // Cleanup temp directory (best-effort)
        try {
            $this->rrmdir($tmpDir);
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json([
            'uploaded_count' => $uploadedCount,
            'error_count' => count($errors),
            'categories_created' => [],
            'products' => $createdProducts,
            'errors' => $errors,
            'summary' => $summary,
            'processed_groups' => count($allGroups),
            'total_groups' => count($grouped),
        ]);
    }

    private function rrmdir(string $dir): void
    {
        if (!is_dir($dir)) return;
        $objects = scandir($dir) ?: [];
        foreach ($objects as $object) {
            if ($object === '.' || $object === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $object;
            if (is_dir($path)) {
                $this->rrmdir($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }

    // Simple heuristics to infer metadata from folder/file names
    private function inferBrandFromText(string $text): ?string
    {
        $map = [
            'rayban' => 'Ray-Ban', 'oakley' => 'Oakley', 'gucci' => 'Gucci', 'prada' => 'Prada',
            'nike' => 'Nike', 'adidas' => 'Adidas', 'puma' => 'Puma', 'levis' => "Levi's",
            'fendi' => 'Fendi', 'dior' => 'Dior'
        ];
        foreach ($map as $needle => $label) {
            if (str_contains($text, $needle)) return $label;
        }
        return null;
    }

    private function inferShapeFromText(string $text): ?string
    {
        $shapes = [
            'aviator', 'round', 'square', 'rectangle', 'cat eye', 'cateye', 'wayfarer', 'oval'
        ];
        foreach ($shapes as $shape) {
            if (str_contains($text, $shape)) {
                return $shape === 'cat eye' ? 'cat-eye' : $shape;
            }
        }
        return null;
    }

    private function inferColorFromText(string $text): ?string
    {
        $colors = ['black','brown','blue','red','green','gold','silver','gray','grey','pink','purple','yellow','white','orange','clear'];
        foreach ($colors as $color) {
            if (preg_match('/\b' . preg_quote($color, '/') . '\b/', $text)) {
                return $color === 'grey' ? 'gray' : $color;
            }
        }
        return null;
    }
}




