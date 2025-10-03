<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

echo "Testing authentication:\n";

// Find a customer user
$customer = User::where('role', 'customer')->first();
if ($customer) {
    echo "Found customer: " . $customer->name . " (" . $customer->email . ")\n";
    
    // Create a token for testing
    $token = $customer->createToken('test-token')->plainTextToken;
    echo "Created token: " . $token . "\n";
    
    // Test the API with the token
    $url = 'http://localhost:8000/api/prescriptions';
    $headers = [
        'Accept: application/json',
        'Authorization: Bearer ' . $token
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: " . $httpCode . "\n";
    echo "Response: " . $response . "\n";
} else {
    echo "No customer found\n";
}
