<?php

require_once 'vendor/autoload.php';
require_once 'bootstrap/app.php';

$user = \App\Models\User::where('email', 'admin@everbright.com')->first();
if ($user) {
    $user->password = \Illuminate\Support\Facades\Hash::make('password123');
    $user->is_approved = true;
    $user->role = 'admin';
    $user->save();
    echo "User updated successfully\n";
} else {
    echo "User not found\n";
}
