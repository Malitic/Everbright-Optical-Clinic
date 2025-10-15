<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== ALL USERS IN DATABASE ===\n\n";

$users = User::all();

echo "Total users: " . $users->count() . "\n\n";

// Group by role
$roles = ['admin', 'staff', 'customer', 'optometrist'];

foreach ($roles as $role) {
    $roleUsers = $users->where('role', $role);
    if ($roleUsers->count() > 0) {
        echo "\n==== " . strtoupper($role) . " ACCOUNTS ====\n";
        foreach ($roleUsers as $user) {
            echo "ID: " . $user->id . "\n";
            echo "Name: " . $user->name . "\n";
            echo "Email: " . $user->email . "\n";
            echo "Role: " . $user->role->value . "\n";
            echo "Approved: " . ($user->is_approved ? '✓ YES' : '✗ NO (BLOCKED)') . "\n";
            echo "Branch: " . ($user->branch ? $user->branch->name : 'None') . "\n";
            
            // Test password
            $testPasswords = ['password', 'password123', '123456789', '12345678'];
            $passwordFound = false;
            foreach ($testPasswords as $pwd) {
                if (\Illuminate\Support\Facades\Hash::check($pwd, $user->password)) {
                    echo "Password: '" . $pwd . "' ✓\n";
                    $passwordFound = true;
                    break;
                }
            }
            if (!$passwordFound) {
                echo "Password: Unknown (not in common list)\n";
            }
            
            echo "---\n";
        }
    }
}

// Check for unapproved accounts
echo "\n==== UNAPPROVED ACCOUNTS (Cannot Login) ====\n";
$unapproved = User::where('is_approved', false)->get();
if ($unapproved->count() > 0) {
    foreach ($unapproved as $user) {
        echo "- " . $user->name . " (" . $user->email . ") - Role: " . $user->role->value . "\n";
    }
} else {
    echo "None - All accounts are approved!\n";
}

