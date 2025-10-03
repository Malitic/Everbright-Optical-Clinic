<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Prescription;

echo "Fixing prescription 1:\n";

$prescription = Prescription::find(1);
if ($prescription) {
    echo "Before - Right Eye: " . json_encode($prescription->right_eye) . "\n";
    echo "Before - Left Eye: " . json_encode($prescription->left_eye) . "\n";
    
    // Decode the double-encoded JSON
    $prescription->right_eye = json_decode($prescription->right_eye, true);
    $prescription->left_eye = json_decode($prescription->left_eye, true);
    $prescription->save();
    
    echo "After - Right Eye: " . json_encode($prescription->right_eye) . "\n";
    echo "After - Left Eye: " . json_encode($prescription->left_eye) . "\n";
    echo "Fixed!\n";
} else {
    echo "Prescription not found\n";
}
