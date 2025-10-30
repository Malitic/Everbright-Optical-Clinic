<?php

require_once 'vendor/autoload.php';
require_once 'bootstrap/app.php';

$data = json_decode(file_get_contents('php://input'), true) ?: [
    'email' => 'admin@everbright.com',
    'password' => 'password123',
    'role' => 'admin'
];

// Simulate login
$user = \App\Models\User::where('email', $data['email'])->first();
if (!$user) {
    die("User not found\n");
}

echo "User: {$user->email}, Password hash: " . substr($user->password, 0, 20) . "...\n";
echo "Role: {$user->role}, Approved: " . ($user->is_approved ? 'true' : 'false') . "\n";

$passwordMatches = \Illuminate\Support\Facades\Hash::check($data['password'], $user->password);
echo "Password check: " . ($passwordMatches ? 'PASS' : 'FAIL') . "\n";

if ($data['role'] && strcasecmp($user->role, $data['role']) !== 0) {
    echo "Role mismatch: user has '{$user->role}', requested '{$data['role']}'\n";
} else {
    echo "Role match: OK\n";
}
