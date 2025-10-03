<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Branch;

echo "=== ROLE CONNECTION TEST ===\n\n";

// Test 1: Check if all roles exist in database
echo "1. Checking user roles in database:\n";
$roles = User::select('role', DB::raw('count(*) as count'))
    ->groupBy('role')
    ->get();

foreach ($roles as $role) {
    echo "   - {$role->role}: {$role->count} users\n";
}

// Test 2: Check if branches exist
echo "\n2. Checking branches:\n";
$branches = Branch::all();
foreach ($branches as $branch) {
    echo "   - {$branch->name} (ID: {$branch->id})\n";
}

// Test 3: Check appointments and their relationships
echo "\n3. Checking appointments:\n";
$appointments = Appointment::with(['patient', 'optometrist', 'branch'])->get();
echo "   Total appointments: " . $appointments->count() . "\n";

foreach ($appointments as $apt) {
    $patientName = $apt->patient ? $apt->patient->name : 'Unknown';
    $optometristName = $apt->optometrist ? $apt->optometrist->name : 'Unknown';
    $branchName = $apt->branch ? $apt->branch->name : 'Unknown';
    
    echo "   - ID: {$apt->id}, Patient: {$patientName}, Optometrist: {$optometristName}, Branch: {$branchName}, Status: {$apt->status}\n";
}

// Test 4: Check role-specific data access
echo "\n4. Testing role-specific data access:\n";

// Customer role
$customers = User::where('role', 'customer')->where('is_approved', true)->get();
echo "   Customers (approved): " . $customers->count() . "\n";

// Staff role
$staff = User::where('role', 'staff')->where('is_approved', true)->get();
echo "   Staff (approved): " . $staff->count() . "\n";
foreach ($staff as $s) {
    $branchName = $s->branch ? $s->branch->name : 'No branch';
    echo "     - {$s->name} at {$branchName}\n";
}

// Optometrist role
$optometrists = User::where('role', 'optometrist')->where('is_approved', true)->get();
echo "   Optometrists (approved): " . $optometrists->count() . "\n";
foreach ($optometrists as $o) {
    echo "     - {$o->name}\n";
}

// Test 5: Check appointment filtering by role
echo "\n5. Testing appointment filtering:\n";

if ($customers->count() > 0) {
    $customer = $customers->first();
    $customerAppointments = Appointment::where('patient_id', $customer->id)->get();
    echo "   Customer '{$customer->name}' appointments: " . $customerAppointments->count() . "\n";
}

if ($staff->count() > 0) {
    $staffMember = $staff->first();
    $staffAppointments = Appointment::where('branch_id', $staffMember->branch_id)->get();
    echo "   Staff '{$staffMember->name}' branch appointments: " . $staffAppointments->count() . "\n";
}

if ($optometrists->count() > 0) {
    $optometrist = $optometrists->first();
    $optometristAppointments = Appointment::where('optometrist_id', $optometrist->id)->get();
    echo "   Optometrist '{$optometrist->name}' appointments: " . $optometristAppointments->count() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";

