<?php

require_once 'backend/vendor/autoload.php';

// Force SQLite for testing
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=' . __DIR__ . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'database.sqlite');

$app = require_once 'backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Role Request Functionality\n";
echo "==================================\n\n";

// Check if role requests table exists and has data
$roleRequests = App\Models\RoleRequest::all();
echo "Current role requests: {$roleRequests->count()}\n";

if ($roleRequests->count() > 0) {
    echo "\nExisting role requests:\n";
    foreach ($roleRequests as $request) {
        echo "- User: {$request->user->name} ({$request->user->email})\n";
        echo "  Requested Role: {$request->requested_role}\n";
        echo "  Status: {$request->status}\n";
        echo "  Created: {$request->created_at}\n\n";
    }
} else {
    echo "No role requests found.\n";
}

// Test creating a role request
echo "Testing role request creation...\n";
$user = App\Models\User::where('email', 'protacioalmerjann@gmail.com')->first();
if ($user) {
    echo "Creating role request for {$user->name} to become optometrist...\n";
    
    try {
        $roleRequest = App\Models\RoleRequest::create([
            'user_id' => $user->id,
            'requested_role' => 'optometrist',
            'status' => 'pending'
        ]);
        echo "✅ Role request created successfully! ID: {$roleRequest->id}\n";
    } catch (Exception $e) {
        echo "❌ Error creating role request: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ User not found\n";
}

// Check role requests again
$updatedRequests = App\Models\RoleRequest::all();
echo "\nUpdated role requests: {$updatedRequests->count()}\n";

if ($updatedRequests->count() > 0) {
    echo "\nAll role requests:\n";
    foreach ($updatedRequests as $request) {
        echo "- User: {$request->user->name} ({$request->user->email})\n";
        echo "  Requested Role: {$request->requested_role}\n";
        echo "  Status: {$request->status}\n";
        echo "  Created: {$request->created_at}\n\n";
    }
}

echo "Role request test completed!\n";

?>
