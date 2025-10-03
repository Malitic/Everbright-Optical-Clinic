<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\PrescriptionController;
use App\Models\User;
use Illuminate\Http\Request;

echo "Testing index method directly:\n";

try {
    $user = User::where('role', 'customer')->first();
    echo "User: " . $user->name . "\n";
    
    // Create a mock request
    $request = new Request();
    
    // Set the authenticated user
    Auth::login($user);
    
    // Create controller instance
    $controller = new PrescriptionController();
    
    // Call the index method
    $response = $controller->index($request);
    
    echo "Response status: " . $response->getStatusCode() . "\n";
    echo "Response content: " . $response->getContent() . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
