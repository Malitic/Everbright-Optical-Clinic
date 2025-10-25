<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'Everbright Optical System',
        'mode' => 'full-stack',
        'timestamp' => now()
    ]);
});

// Serve frontend assets
Route::get('/assets/{file}', function ($file) {
    $assetPath = public_path('assets/' . $file);
    if (File::exists($assetPath)) {
        $mimeType = mime_content_type($assetPath);
        return response()->file($assetPath, ['Content-Type' => $mimeType]);
    }
    return response()->json(['error' => 'Asset not found'], 404);
});

// Serve other frontend files
Route::get('/{file}', function ($file) {
    $filePath = public_path($file);
    if (File::exists($filePath)) {
        $mimeType = mime_content_type($filePath);
        return response()->file($filePath, ['Content-Type' => $mimeType]);
    }
    return response()->json(['error' => 'File not found'], 404);
});

// Serve frontend for root route only
Route::get('/', function () {
    $indexPath = public_path('index.html');
    
    if (File::exists($indexPath)) {
        return response()->file($indexPath, ['Content-Type' => 'text/html']);
    }
    
    // Fallback error
    return response()->json([
        'status' => 'error',
        'message' => 'Frontend not found in public',
        'index_path' => $indexPath,
        'timestamp' => now()
    ]);
});
