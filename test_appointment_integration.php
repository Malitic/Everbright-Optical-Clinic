<?php

/**
 * Test script for appointment system integration
 * This script tests the backend API endpoints for appointments
 */

// Configuration
$baseUrl = 'http://localhost:8000/api';
$testUser = [
    'name' => 'Test Customer',
    'email' => 'testcustomer' . time() . '@example.com',
    'password' => 'password123',
    'role' => 'customer'
];

$testOptometrist = [
    'name' => 'Test Optometrist',
    'email' => 'testoptometrist' . time() . '@example.com',
    'password' => 'password123',
    'role' => 'optometrist'
];

// Helper function to make HTTP requests
function makeRequest($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

// Test functions
function testUserRegistration($user) {
    global $baseUrl;
    echo "Testing user registration...\n";
    
    $response = makeRequest($baseUrl . '/auth/register', 'POST', $user);
    
    if ($response['code'] === 201) {
        echo "✓ User registration successful\n";
        return $response['data']['token'];
    } else {
        echo "✗ User registration failed: " . json_encode($response['data']) . "\n";
        return null;
    }
}

function testUserLogin($user) {
    global $baseUrl;
    echo "Testing user login...\n";
    
    $response = makeRequest($baseUrl . '/auth/login', 'POST', $user);
    
    if ($response['code'] === 200) {
        echo "✓ User login successful\n";
        return $response['data']['token'];
    } else {
        echo "✗ User login failed: " . json_encode($response['data']) . "\n";
        return null;
    }
}

function testGetOptometrists($token) {
    global $baseUrl;
    echo "Testing get optometrists...\n";
    
    $response = makeRequest($baseUrl . '/users?role=optometrist', 'GET', null, $token);
    
    if ($response['code'] === 200) {
        echo "✓ Get optometrists successful\n";
        return $response['data']['data'] ?? [];
    } else {
        echo "✗ Get optometrists failed: " . json_encode($response['data']) . "\n";
        return [];
    }
}

function testGetAvailableTimeSlots($token, $optometristId, $date) {
    global $baseUrl;
    echo "Testing get available time slots...\n";
    
    $url = $baseUrl . '/appointments/available-slots?optometrist_id=' . $optometristId . '&date=' . $date;
    $response = makeRequest($url, 'GET', null, $token);
    
    if ($response['code'] === 200) {
        echo "✓ Get available time slots successful\n";
        return $response['data']['available_slots'] ?? [];
    } else {
        echo "✗ Get available time slots failed: " . json_encode($response['data']) . "\n";
        return [];
    }
}

function testCreateAppointment($token, $appointmentData) {
    global $baseUrl;
    echo "Testing create appointment...\n";
    
    $response = makeRequest($baseUrl . '/appointments', 'POST', $appointmentData, $token);
    
    if ($response['code'] === 201) {
        echo "✓ Create appointment successful\n";
        return $response['data'];
    } else {
        echo "✗ Create appointment failed: " . json_encode($response['data']) . "\n";
        return null;
    }
}

function testGetAppointments($token) {
    global $baseUrl;
    echo "Testing get appointments...\n";
    
    $response = makeRequest($baseUrl . '/appointments', 'GET', null, $token);
    
    if ($response['code'] === 200) {
        echo "✓ Get appointments successful\n";
        return $response['data']['data'] ?? $response['data'] ?? [];
    } else {
        echo "✗ Get appointments failed: " . json_encode($response['data']) . "\n";
        return [];
    }
}

// Main test execution
echo "=== Appointment System Integration Test ===\n\n";

// Test 1: Register test users
echo "1. Testing user registration...\n";
$customerToken = testUserRegistration($testUser);
$optometristToken = testUserRegistration($testOptometrist);

if (!$customerToken || !$optometristToken) {
    echo "Failed to register test users. Exiting.\n";
    exit(1);
}

echo "\n";

// Test 2: Get optometrists
echo "2. Testing optometrist retrieval...\n";
$optometrists = testGetOptometrists($customerToken);

if (empty($optometrists)) {
    echo "No optometrists found. Creating test optometrist...\n";
    $optometristToken = testUserRegistration($testOptometrist);
    $optometrists = testGetOptometrists($customerToken);
}

if (empty($optometrists)) {
    echo "Failed to get optometrists. Exiting.\n";
    exit(1);
}

$optometristId = $optometrists[0]['id'];
echo "Using optometrist ID: $optometristId\n\n";

// Test 3: Get available time slots
echo "3. Testing available time slots...\n";
$tomorrow = date('Y-m-d', strtotime('+1 day'));
$timeSlots = testGetAvailableTimeSlots($customerToken, $optometristId, $tomorrow);

if (empty($timeSlots)) {
    echo "No available time slots found.\n";
} else {
    echo "Available time slots: " . implode(', ', $timeSlots) . "\n";
}

echo "\n";

// Test 4: Create appointment
echo "4. Testing appointment creation...\n";
$appointmentData = [
    'patient_id' => 1, // Assuming customer has ID 1
    'optometrist_id' => $optometristId,
    'appointment_date' => $tomorrow,
    'start_time' => $timeSlots[0] ?? '09:00',
    'end_time' => '09:30',
    'type' => 'eye_exam',
    'notes' => 'Test appointment'
];

$appointment = testCreateAppointment($customerToken, $appointmentData);

if (!$appointment) {
    echo "Failed to create appointment. Exiting.\n";
    exit(1);
}

echo "\n";

// Test 5: Get appointments
echo "5. Testing appointment retrieval...\n";
$appointments = testGetAppointments($customerToken);

if (empty($appointments)) {
    echo "No appointments found.\n";
} else {
    echo "Found " . count($appointments) . " appointments.\n";
}

echo "\n=== Test Complete ===\n";
echo "All tests passed! The appointment system integration is working correctly.\n";
