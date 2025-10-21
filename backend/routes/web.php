<?php

use Illuminate\Support\Facades\Route;

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'Everbright Optical System',
        'mode' => 'backend-only',
        'timestamp' => now()
    ]);
});

// API status route
Route::get('/', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Everbright Optical System API is running',
        'mode' => 'backend-only',
        'version' => '1.0.0',
        'timestamp' => now(),
        'note' => 'Frontend build disabled. API endpoints available at /api/*'
    ]);
});

// API routes are handled in routes/api.php
