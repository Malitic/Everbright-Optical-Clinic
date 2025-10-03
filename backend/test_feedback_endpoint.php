<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Appointment;
use App\Models\Feedback;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing feedback endpoint...\n";

try {
    // Find a customer user
    $customer = User::where('role', 'customer')->first();
    if (!$customer) {
        echo "No customer found in database\n";
        exit;
    }
    
    echo "Found customer: {$customer->name} (ID: {$customer->id})\n";
    
    // Check appointments for this customer
    $appointments = Appointment::where('patient_id', $customer->id)->get();
    echo "Customer has " . $appointments->count() . " appointments\n";
    
    // Check completed appointments
    $completedAppointments = Appointment::where('patient_id', $customer->id)
        ->where('status', 'completed')
        ->get();
    echo "Customer has " . $completedAppointments->count() . " completed appointments\n";
    
    // Check feedback table
    $feedbackCount = Feedback::count();
    echo "Total feedback records: $feedbackCount\n";
    
    // Test the query from the controller
    $availableAppointments = Appointment::where('patient_id', $customer->id)
        ->where('status', 'completed')
        ->whereDoesntHave('feedback')
        ->with(['optometrist', 'branch'])
        ->get();
    
    echo "Available appointments for feedback: " . $availableAppointments->count() . "\n";
    
    foreach ($availableAppointments as $appointment) {
        echo "- Appointment ID: {$appointment->id}, Date: {$appointment->appointment_date}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
