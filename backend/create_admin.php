<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
\Illuminate\Support\Facades\Facade::setFacadeApplication($app);

$user = new App\Models\User();
$user->fill([
    'name' => 'Admin User',
    'email' => 'admin@everbright.com',
    'password' => 'password123', // Will be auto-hashed by model
    'role' => 'admin',
    'is_approved' => true,
]);
$user->save();

echo "Admin user created successfully\n";
echo "Email: admin@everbright.com\n";
echo "Password: password123\n";
