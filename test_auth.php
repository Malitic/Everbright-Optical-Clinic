<?php

// Simple test script to verify authentication functionality
// Run this from the backend directory: php test_auth.php

require_once 'backend/vendor/autoload.php';

use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once 'backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Authentication Test ===\n\n";

// Test 1: Create a test user
echo "1. Creating test user...\n";
$testEmail = 'test' . time() . '@example.com';
$user = User::create([
    'name' => 'Test User',
    'email' => $testEmail,
    'password' => Hash::make('password123'),
    'role' => 'customer'
]);

echo "   ✓ User created with ID: {$user->id}\n\n";

// Test 2: Test login with correct credentials
echo "2. Testing login with correct credentials...\n";

$loginData = [
    'email' => $testEmail,
    'password' => 'password123',
    'role' => 'customer'
];

$request = new Request();
$request->merge($loginData);

$controller = new AuthController();
$response = $controller->login($request);

if ($response->getStatusCode() === 200) {
    echo "   ✓ Login successful!\n";
    $data = json_decode($response->getContent(), true);
    echo "   ✓ Token received: " . substr($data['token'], 0, 20) . "...\n";
} else {
    echo "   ✗ Login failed!\n";
    echo "   Response: " . $response->getContent() . "\n";
}

echo "\n";

// Test 3: Test login with wrong password
echo "3. Testing login with wrong password...\n";

$wrongLoginData = [
    'email' => 'test@example.com',
    'password' => 'wrongpassword',
    'role' => 'customer'
];

$request2 = new Request();
$request2->merge($wrongLoginData);

$response2 = $controller->login($request2);

if ($response2->getStatusCode() === 401) {
    echo "   ✓ Correctly rejected wrong password!\n";
} else {
    echo "   ✗ Should have rejected wrong password!\n";
    echo "   Response: " . $response2->getContent() . "\n";
}

echo "\n";

// Test 4: Test login with wrong role
echo "4. Testing login with wrong role...\n";

$wrongRoleData = [
    'email' => 'test@example.com',
    'password' => 'password123',
    'role' => 'admin'
];

$request3 = new Request();
$request3->merge($wrongRoleData);

$response3 = $controller->login($request3);

if ($response3->getStatusCode() === 401) {
    echo "   ✓ Correctly rejected wrong role!\n";
} else {
    echo "   ✗ Should have rejected wrong role!\n";
    echo "   Response: " . $response3->getContent() . "\n";
}

echo "\n";

// Cleanup
echo "5. Cleaning up test data...\n";
$user->delete();
echo "   ✓ Test user deleted\n";

echo "\n=== Test Complete ===\n";
echo "If all tests passed, your authentication is working correctly!\n";
