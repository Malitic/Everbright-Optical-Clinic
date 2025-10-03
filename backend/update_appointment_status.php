<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Appointment;

echo "Updating appointment status...\n";

// Find an appointment for the optometrist
$appointment = Appointment::where('optometrist_id', 25)->first(); // Samuel's ID
if (!$appointment) {
    echo "No appointment found for optometrist\n";
    exit;
}

echo "Found appointment: {$appointment->id}\n";
echo "Current status: {$appointment->status}\n";

// Update status to in_progress
$appointment->status = 'in_progress';
$appointment->save();

echo "Updated appointment status to: {$appointment->status}\n";
