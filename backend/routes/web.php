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

// Serve frontend for root route only
Route::get('/', function () {
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
    
    // Serve index.html for root route
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
});
