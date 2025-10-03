<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Prescription;
use App\Models\User;
use App\Enums\UserRole;

echo "Detailed debugging:\n";

try {
    $user = User::where('role', 'customer')->first();
    echo "User found: " . $user->name . "\n";
    echo "User role type: " . gettype($user->role) . "\n";
    echo "User role value: " . $user->role->value . "\n";
    
    $query = Prescription::query();
    echo "Query created\n";
    
    // Test the switch statement
    switch ($user->role->value) {
        case UserRole::CUSTOMER->value:
            echo "Customer case matched\n";
            $query->where('patient_id', $user->id);
            break;
        case UserRole::OPTOMETRIST->value:
            echo "Optometrist case matched\n";
            break;
        case UserRole::STAFF->value:
        case UserRole::ADMIN->value:
            echo "Staff/Admin case matched\n";
            break;
        default:
            echo "Default case matched\n";
            break;
    }
    
    echo "Switch completed\n";
    
    // Add relationships
    $query->with(['patient', 'optometrist', 'appointment', 'branch']);
    echo "Relationships added\n";
    
    // Test the query
    $prescriptions = $query->orderBy('issue_date', 'desc')->get();
    echo "Query executed, found " . $prescriptions->count() . " prescriptions\n";
    
    // Test pagination
    $paginated = $query->orderBy('issue_date', 'desc')->paginate(15);
    echo "Pagination created\n";
    
    // Test toArray
    $array = $paginated->toArray();
    echo "Converted to array\n";
    
    // Test JSON encoding
    $json = json_encode($array);
    echo "Converted to JSON, length: " . strlen($json) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
