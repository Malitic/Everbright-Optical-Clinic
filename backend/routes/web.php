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
    // Try multiple possible paths for frontend
    $possiblePaths = [
        base_path('frontend--/dist'),
        base_path('../frontend--/dist'),
        '/app/frontend--/dist',
        public_path('../frontend--/dist')
    ];
    
    $frontendPath = null;
    foreach ($possiblePaths as $testPath) {
        if (File::exists($testPath) && File::exists($testPath . '/index.html')) {
            $frontendPath = $testPath;
            break;
        }
    }
    
    // If no frontend found, return detailed debug info
    if (!$frontendPath) {
        return response()->json([
            'status' => 'error',
            'message' => 'Frontend not found',
            'base_path' => base_path(),
            'public_path' => public_path(),
            'checked_paths' => $possiblePaths,
            'directory_contents' => File::directories(base_path()),
            'solution' => 'Check if frontend--/dist/ directory exists and contains index.html',
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
    
    // Fallback error
    return response()->json([
        'status' => 'error',
        'message' => 'Frontend index.html not found',
        'frontend_path' => $frontendPath,
        'timestamp' => now()
    ]);
})->where('path', '.*');
