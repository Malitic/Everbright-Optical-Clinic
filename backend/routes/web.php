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

// Serve frontend for all non-API routes
Route::get('/{path?}', function ($path = '') {
    $frontendPath = base_path('../frontend--/dist');
    
    // Check if frontend directory exists
    if (!File::exists($frontendPath)) {
        return response()->json([
            'status' => 'error',
            'message' => 'Frontend build directory not found',
            'frontend_path' => $frontendPath,
            'base_path' => base_path(),
            'solution' => 'Frontend build failed during deployment. Check Railway logs for build errors.',
            'timestamp' => now()
        ]);
    }
    
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
    
    // Debug: List files in frontend directory
    $files = File::files($frontendPath);
    $fileList = array_map(function($file) {
        return $file->getFilename();
    }, $files);
    
    return response()->json([
        'status' => 'error',
        'message' => 'Frontend index.html not found',
        'frontend_path' => $frontendPath,
        'files_found' => $fileList,
        'solution' => 'Frontend build completed but index.html is missing. Check build process.',
        'timestamp' => now()
    ]);
})->where('path', '.*');
