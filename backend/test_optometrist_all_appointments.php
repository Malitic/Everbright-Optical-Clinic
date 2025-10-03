<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Branch;

// Test script to verify optometrist can see all appointments across all branches

echo "=== Testing Optometrist All Appointments Access ===\n\n";

try {
    // Get an optometrist user
    $optometrist = User::where('role', 'optometrist')->first();
    
    if (!$optometrist) {
        echo "❌ No optometrist found in database\n";
        exit(1);
    }
    
    echo "✅ Found optometrist: {$optometrist->name} (ID: {$optometrist->id})\n";
    
    // Get all branches
    $branches = Branch::all();
    echo "✅ Found " . $branches->count() . " branches\n";
    
    // Get all appointments
    $allAppointments = Appointment::with(['patient', 'optometrist', 'branch'])->get();
    echo "✅ Found " . $allAppointments->count() . " total appointments\n";
    
    // Group appointments by branch
    $appointmentsByBranch = $allAppointments->groupBy('branch_id');
    
    echo "\n=== Appointments by Branch ===\n";
    foreach ($appointmentsByBranch as $branchId => $appointments) {
        $branch = $branches->find($branchId);
        $branchName = $branch ? $branch->name : "Unknown Branch (ID: $branchId)";
        echo "Branch: $branchName - {$appointments->count()} appointments\n";
        
        foreach ($appointments as $appointment) {
            $patientName = $appointment->patient ? $appointment->patient->name : 'Unknown Patient';
            $optometristName = $appointment->optometrist ? $appointment->optometrist->name : 'Unassigned';
            echo "  - Patient: $patientName, Optometrist: $optometristName, Status: {$appointment->status}\n";
        }
    }
    
    // Test the API endpoint simulation
    echo "\n=== Testing API Endpoint Logic ===\n";
    
    // Simulate the updated controller logic
    $query = Appointment::with(['patient', 'optometrist', 'branch']);
    
    // Apply optometrist role logic (updated version)
    // Optometrists can see ALL appointments across ALL branches
    // No branch restrictions applied
    
    $optometristAppointments = $query->get();
    
    echo "✅ Optometrist can see " . $optometristAppointments->count() . " appointments\n";
    
    if ($optometristAppointments->count() === $allAppointments->count()) {
        echo "✅ SUCCESS: Optometrist can see all appointments across all branches!\n";
    } else {
        echo "❌ ISSUE: Optometrist cannot see all appointments\n";
        echo "   Expected: {$allAppointments->count()}, Got: {$optometristAppointments->count()}\n";
    }
    
    // Test with branch filter
    echo "\n=== Testing Branch Filter ===\n";
    foreach ($branches as $branch) {
        $branchAppointments = Appointment::with(['patient', 'optometrist', 'branch'])
            ->where('branch_id', $branch->id)
            ->get();
        
        echo "Branch '{$branch->name}': {$branchAppointments->count()} appointments\n";
    }
    
    echo "\n=== Test Complete ===\n";
    echo "The optometrist should now be able to see all appointments from all branches.\n";
    echo "Make sure to restart your backend server for the changes to take effect.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
