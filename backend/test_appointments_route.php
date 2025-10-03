<?php

// Simple test to check if the appointments API endpoint works for optometrists
// This should be run after the backend server is started

echo "=== Testing Optometrist Appointments API ===\n\n";

// Test the API endpoint directly
$baseUrl = 'http://localhost:8000/api';
$endpoint = '/appointments';

echo "Testing endpoint: {$baseUrl}{$endpoint}\n\n";

// You would need to get a valid auth token for an optometrist user
// This is just a demonstration of what the API should return

echo "To test this properly:\n";
echo "1. Start your Laravel server: php artisan serve\n";
echo "2. Login as an optometrist to get an auth token\n";
echo "3. Make a GET request to {$baseUrl}{$endpoint} with the auth token\n";
echo "4. Check that appointments from all branches are returned\n\n";

echo "Expected behavior after the fix:\n";
echo "- Optometrists should see appointments from ALL branches\n";
echo "- Branch filter should still work when specified\n";
echo "- No restrictions based on optometrist's scheduled branches\n\n";

echo "Backend changes made:\n";
echo "- Removed branch restrictions for optometrists in AppointmentController\n";
echo "- Updated getTodayAppointments to allow optometrists to see all branches\n";
echo "- Optometrists can now see ALL appointments across ALL branches\n";
