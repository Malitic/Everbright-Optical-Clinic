<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== USERS IN DATABASE ===\n\n";

$users = User::all();

if ($users->count() === 0) {
    echo "No users found in database!\n";
} else {
    echo "Total users: " . $users->count() . "\n\n";
    
    foreach ($users as $user) {
        echo "ID: " . $user->id . "\n";
        echo "Name: " . $user->name . "\n";
        echo "Email: " . $user->email . "\n";
        echo "Role: " . $user->role->value . "\n";
        echo "Approved: " . ($user->is_approved ? 'Yes' : 'No') . "\n";
        echo "---\n";
    }
}

// Test password verification
echo "\n=== TESTING PASSWORD VERIFICATION ===\n";
$admin = User::where('email', 'admin@test.com')->first();
if ($admin) {
    $testPassword = 'password123';
    $isValid = \Illuminate\Support\Facades\Hash::check($testPassword, $admin->password);
    echo "Admin user found\n";
    echo "Password 'password123' is " . ($isValid ? "VALID ✓" : "INVALID ✗") . "\n";
} else {
    echo "Admin user NOT found!\n";
}

