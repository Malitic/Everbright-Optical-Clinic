<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== TESTING LOGIN SCENARIOS ===\n\n";

// Test credentials
$testCases = [
    [
        'email' => 'admin@test.com',
        'password' => 'password123',
        'role' => 'admin'
    ],
    [
        'email' => 'admin@everbright.com',
        'password' => 'password123',
        'role' => 'admin'
    ],
];

foreach ($testCases as $index => $credentials) {
    echo "Test Case " . ($index + 1) . ":\n";
    echo "Email: " . $credentials['email'] . "\n";
    echo "Password: " . $credentials['password'] . "\n";
    echo "Role: " . $credentials['role'] . "\n";
    
    $user = User::where('email', $credentials['email'])->first();
    
    if (!$user) {
        echo "Result: ❌ User not found\n\n";
        continue;
    }
    
    echo "User found: " . $user->name . "\n";
    
    $passwordCheck = Hash::check($credentials['password'], $user->password);
    echo "Password check: " . ($passwordCheck ? "✓ Valid" : "✗ Invalid") . "\n";
    
    $isApproved = $user->is_approved;
    echo "Account approved: " . ($isApproved ? "✓ Yes" : "✗ No") . "\n";
    
    $userRoleValue = $user->role->value ?? (string)$user->role;
    $roleMatch = $credentials['role'] === $userRoleValue;
    echo "Role match: " . ($roleMatch ? "✓ Yes" : "✗ No (User role: $userRoleValue)") . "\n";
    
    if ($passwordCheck && $isApproved && $roleMatch) {
        echo "Result: ✅ LOGIN SHOULD SUCCEED\n";
    } else {
        echo "Result: ❌ LOGIN SHOULD FAIL\n";
    }
    
    echo "\n";
}

// Try to find what password these users actually have
echo "=== CHECKING EXISTING ADMIN USERS ===\n";
$admins = User::where('role', 'admin')->get();
foreach ($admins as $admin) {
    echo "\nAdmin: " . $admin->name . " (" . $admin->email . ")\n";
    echo "Approved: " . ($admin->is_approved ? 'Yes' : 'No') . "\n";
    
    // Test common passwords
    $commonPasswords = ['password', 'password123', 'admin123', '12345678'];
    foreach ($commonPasswords as $pwd) {
        if (Hash::check($pwd, $admin->password)) {
            echo "Password is: '$pwd' ✓\n";
            break;
        }
    }
}

