<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Everbright Optical System API is running',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'Everbright Optical System',
        'timestamp' => now()
    ]);
});
