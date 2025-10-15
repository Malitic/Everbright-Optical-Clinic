<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Create admin user
$admin = User::firstOrCreate(
    ['email' => 'admin@everbright.com'],
    [
        'name' => 'Admin User',
        'password' => Hash::make('password123'),
        'role' => 'admin',
        'is_approved' => true,
        'is_protected' => true,
    ]
);

echo "✅ Admin user created/found: {$admin->email}\n";
echo "   Password: password123\n";
echo "   Role: {$admin->role}\n";

// Create test customer
$customer = User::firstOrCreate(
    ['email' => 'customer@test.com'],
    [
        'name' => 'Test Customer',
        'password' => Hash::make('password123'),
        'role' => 'customer',
        'is_approved' => true,
    ]
);

echo "✅ Customer user created/found: {$customer->email}\n";

echo "\n✅ All test users created successfully!\n";

