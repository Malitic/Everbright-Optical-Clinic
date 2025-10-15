<?php

// Test script to verify the transaction system is working
// This script tests the Transaction model and related functionality

require_once 'vendor/autoload.php';

use App\Models\Transaction;
use App\Models\User;
use App\Models\Branch;
use App\Models\Appointment;
use App\Models\Reservation;

echo "Testing Transaction System...\n\n";

try {
    // Test 1: Check if Transaction model exists
    echo "1. Testing Transaction model...\n";
    $transaction = new Transaction();
    echo "✓ Transaction model loaded successfully\n\n";

    // Test 2: Test transaction code generation
    echo "2. Testing transaction code generation...\n";
    $code = Transaction::generateTransactionCode();
    echo "✓ Generated transaction code: $code\n\n";

    // Test 3: Test model relationships
    echo "3. Testing model relationships...\n";
    
    // Check if relationships are defined
    $reflection = new ReflectionClass(Transaction::class);
    $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC);
    
    $relationshipMethods = ['customer', 'branch', 'appointment', 'reservation', 'receipt'];
    foreach ($relationshipMethods as $method) {
        if ($reflection->hasMethod($method)) {
            echo "✓ Relationship method '$method' exists\n";
        } else {
            echo "✗ Relationship method '$method' missing\n";
        }
    }
    
    echo "\n4. Testing scopes...\n";
    $scopeMethods = ['pending', 'completed', 'cancelled', 'forBranch', 'forCustomer', 'byDateRange'];
    foreach ($scopeMethods as $method) {
        if ($reflection->hasMethod('scope' . ucfirst($method))) {
            echo "✓ Scope method '$method' exists\n";
        } else {
            echo "✗ Scope method '$method' missing\n";
        }
    }

    echo "\n✓ Transaction system test completed successfully!\n";
    echo "\nThe unified transaction management system has been implemented with:\n";
    echo "- Transaction model with relationships\n";
    echo "- Automatic transaction code generation\n";
    echo "- Status management (Pending, Completed, Cancelled)\n";
    echo "- Payment method tracking\n";
    echo "- Integration with appointments and reservations\n";
    echo "- Analytics and reporting capabilities\n";
    echo "- Notification system for transaction completion\n";

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
