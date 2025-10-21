<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

// Health check route (no sessions needed)
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'Everbright Optical System',
        'timestamp' => now()
    ]);
});

// Serve frontend for all non-API routes (no sessions needed)
Route::get('/{path?}', function ($path = '') {
    $frontendPath = base_path('../frontend--/dist');
    
    // If requesting a specific file, serve it
    if ($path && File::exists($frontendPath . '/' . $path)) {
        $filePath = $frontendPath . '/' . $path;
        $mimeType = File::mimeType($filePath);
        return response()->file($filePath, ['Content-Type' => $mimeType]);
    }
    
    // Serve index.html for all other routes (SPA routing)
    $indexPath = $frontendPath . '/index.html';
    if (File::exists($indexPath)) {
        return response()->file($indexPath, ['Content-Type' => 'text/html']);
    }
    
    // Fallback API response
    return response()->json([
        'status' => 'success',
        'message' => 'Everbright Optical System API is running',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
})->where('path', '.*');
