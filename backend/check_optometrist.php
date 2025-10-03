<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Enums\UserRole;

echo "Checking optometrist users in database...\n";

$optometrists = User::where('role', UserRole::OPTOMETRIST)->get();

if ($optometrists->count() === 0) {
    echo "No optometrist users found!\n";
} else {
    foreach ($optometrists as $optometrist) {
        echo "Optometrist: " . $optometrist->name . " (" . $optometrist->email . ") - Branch: " . ($optometrist->branch_id ?? 'No branch assigned') . "\n";
    }
}

echo "\nTotal optometrists: " . $optometrists->count() . "\n";

// Also check all users to see what's available
echo "\nAll users in database:\n";
$allUsers = User::all();
foreach ($allUsers as $user) {
    $roleValue = $user->role->value ?? (string)$user->role;
    echo "User: " . $user->name . " (" . $user->email . ") - Role: " . $roleValue . "\n";
}
?>

