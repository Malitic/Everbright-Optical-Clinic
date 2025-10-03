<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Testing prescriptions POST method:\n";

// Find a customer user
$customer = User::where('role', 'customer')->first();
if ($customer) {
    echo "Found customer: " . $customer->name . " (" . $customer->email . ")\n";
    
    // Create a token for testing
    $token = $customer->createToken('test-token')->plainTextToken;
    echo "Created token: " . $token . "\n";
    
    // Test the prescriptions POST route
    $url = 'http://localhost:8000/api/prescriptions';
    $headers = [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ];
    
    $data = json_encode([
        'patient_id' => $customer->id,
        'appointment_id' => 64,
        'type' => 'glasses',
        'right_eye' => ['sphere' => '-1.00', 'cylinder' => '0.00', 'axis' => '0', 'pd' => '32'],
        'left_eye' => ['sphere' => '-1.00', 'cylinder' => '0.00', 'axis' => '0', 'pd' => '32'],
        'vision_acuity' => '20/20',
        'additional_notes' => 'Test prescription',
        'recommendations' => 'Use anti-reflective coating'
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: " . $httpCode . "\n";
    echo "Response: " . $response . "\n";
} else {
    echo "No customer found\n";
}
