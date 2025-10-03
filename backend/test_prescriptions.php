<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Prescription;
use App\Models\User;

echo "Testing prescription data:\n";

try {
    $prescriptions = Prescription::with(['patient', 'optometrist'])->get();
    echo "Found " . $prescriptions->count() . " prescriptions\n";
    
    foreach ($prescriptions as $prescription) {
        echo "Prescription ID: " . $prescription->id . "\n";
        echo "Patient ID: " . $prescription->patient_id . "\n";
        echo "Patient Name: " . ($prescription->patient ? $prescription->patient->name : 'No patient') . "\n";
        echo "Optometrist ID: " . $prescription->optometrist_id . "\n";
        echo "Optometrist Name: " . ($prescription->optometrist ? $prescription->optometrist->name : 'No optometrist') . "\n";
        echo "Right Eye: " . json_encode($prescription->right_eye) . "\n";
        echo "Left Eye: " . json_encode($prescription->left_eye) . "\n";
        echo "---\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
