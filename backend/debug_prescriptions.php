<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\Request;

echo "Debugging prescription controller:\n";

try {
    // Simulate the controller logic
    $user = User::where('role', 'customer')->first();
    echo "User: " . $user->name . "\n";
    
    $query = Prescription::query();
    
    // Check user role
    switch ($user->role) {
        case 'customer':
            $query->where('patient_id', $user->id);
            break;
        case 'optometrist':
            $query->where('optometrist_id', $user->id);
            break;
        case 'staff':
        case 'admin':
            // Can see all prescriptions
            break;
        default:
            echo "Unauthorized role: " . $user->role . "\n";
            exit;
    }
    
    echo "Query built successfully\n";
    
    // Add relationships
    $query->with(['patient', 'optometrist', 'appointment', 'branch']);
    echo "Relationships added\n";
    
    // Order and paginate
    $prescriptions = $query->orderBy('issue_date', 'desc')->paginate(15);
    echo "Query executed successfully\n";
    
    // Try to convert to array
    $data = $prescriptions->toArray();
    echo "Converted to array successfully\n";
    
    // Try to convert to JSON
    $json = json_encode($data);
    echo "Converted to JSON successfully\n";
    echo "JSON length: " . strlen($json) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
