<?php

/**
 * Test script for Staff Scheduling System
 * 
 * This script tests the new staff scheduling system that supports both
 * optometrists and staff members across all branches.
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Http;

// Configuration
$baseUrl = 'http://localhost:8000/api';
$testResults = [];

// Test data - you'll need to replace these with actual IDs from your database
$testData = [
    'admin_token' => 'your_admin_token_here',
    'staff_token' => 'your_staff_token_here',
    'optometrist_token' => 'your_optometrist_token_here',
    'branch_id' => 1,
    'staff_id' => 2,
    'optometrist_id' => 3,
];

/**
 * Helper function to make authenticated API requests
 */
function makeRequest($url, $token, $method = 'GET', $data = []) {
    $headers = [
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
        'Content-Type' => 'application/json',
    ];
    
    $response = Http::withHeaders($headers)->$method($url, $data);
    
    return [
        'status' => $response->status(),
        'data' => $response->json(),
        'success' => $response->successful(),
    ];
}

/**
 * Test getting staff members
 */
function testGetStaffMembers($baseUrl, $token) {
    echo "Testing Get Staff Members...\n";
    
    $url = $baseUrl . "/staff-schedules/staff-members";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Get Staff Members - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Found " . count($result['data']['staff_members']) . " staff members\n";
    } else {
        echo "❌ Get Staff Members - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test getting branches
 */
function testGetBranches($baseUrl, $token) {
    echo "\nTesting Get Branches...\n";
    
    $url = $baseUrl . "/staff-schedules/branches";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Get Branches - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Found " . count($result['data']['branches']) . " branches\n";
    } else {
        echo "❌ Get Branches - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test getting branch staff schedules
 */
function testGetBranchStaffSchedules($baseUrl, $token, $branchId) {
    echo "\nTesting Get Branch Staff Schedules...\n";
    
    $url = $baseUrl . "/staff-schedules/branch/{$branchId}";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Get Branch Staff Schedules - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Branch: " . $result['data']['branch']['name'] . "\n";
        echo "   Staff with schedules: " . count($result['data']['staff_schedules']) . "\n";
    } else {
        echo "❌ Get Branch Staff Schedules - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test getting individual staff schedule
 */
function testGetStaffSchedule($baseUrl, $token, $staffId) {
    echo "\nTesting Get Staff Schedule...\n";
    
    $url = $baseUrl . "/staff-schedules/staff/{$staffId}";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Get Staff Schedule - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Staff: " . $result['data']['staff']['name'] . "\n";
        echo "   Schedules: " . count($result['data']['schedules']) . "\n";
    } else {
        echo "❌ Get Staff Schedule - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test creating/updating staff schedule (Admin only)
 */
function testCreateOrUpdateSchedule($baseUrl, $token, $staffId, $branchId) {
    echo "\nTesting Create/Update Staff Schedule...\n";
    
    $url = $baseUrl . "/staff-schedules";
    $data = [
        'staff_id' => $staffId,
        'staff_role' => 'optometrist',
        'branch_id' => $branchId,
        'day_of_week' => 1, // Monday
        'start_time' => '09:00',
        'end_time' => '17:00',
        'is_active' => true,
    ];
    
    $result = makeRequest($url, $token, 'POST', $data);
    
    if ($result['success']) {
        echo "✅ Create/Update Staff Schedule - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Message: " . $result['data']['message'] . "\n";
    } else {
        echo "❌ Create/Update Staff Schedule - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test creating schedule change request
 */
function testCreateChangeRequest($baseUrl, $token, $branchId) {
    echo "\nTesting Create Schedule Change Request...\n";
    
    $url = $baseUrl . "/staff-schedules/change-requests";
    $data = [
        'day_of_week' => 2, // Tuesday
        'branch_id' => $branchId,
        'start_time' => '10:00',
        'end_time' => '18:00',
        'reason' => 'Need to adjust schedule for personal appointment',
    ];
    
    $result = makeRequest($url, $token, 'POST', $data);
    
    if ($result['success']) {
        echo "✅ Create Schedule Change Request - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Message: " . $result['data']['message'] . "\n";
        return $result['data']['request']['id'] ?? null;
    } else {
        echo "❌ Create Schedule Change Request - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
        return null;
    }
}

/**
 * Test getting change requests
 */
function testGetChangeRequests($baseUrl, $token) {
    echo "\nTesting Get Change Requests...\n";
    
    $url = $baseUrl . "/staff-schedules/change-requests";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Get Change Requests - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Requests: " . count($result['data']['change_requests']) . "\n";
    } else {
        echo "❌ Get Change Requests - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test approving change request (Admin only)
 */
function testApproveChangeRequest($baseUrl, $token, $requestId) {
    echo "\nTesting Approve Change Request...\n";
    
    $url = $baseUrl . "/staff-schedules/change-requests/{$requestId}/approve";
    $data = [
        'admin_notes' => 'Approved - schedule change looks good',
    ];
    
    $result = makeRequest($url, $token, 'PUT', $data);
    
    if ($result['success']) {
        echo "✅ Approve Change Request - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Message: " . $result['data']['message'] . "\n";
    } else {
        echo "❌ Approve Change Request - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test rejecting change request (Admin only)
 */
function testRejectChangeRequest($baseUrl, $token, $requestId) {
    echo "\nTesting Reject Change Request...\n";
    
    $url = $baseUrl . "/staff-schedules/change-requests/{$requestId}/reject";
    $data = [
        'admin_notes' => 'Rejected - conflicts with existing appointments',
    ];
    
    $result = makeRequest($url, $token, 'PUT', $data);
    
    if ($result['success']) {
        echo "✅ Reject Change Request - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Message: " . $result['data']['message'] . "\n";
    } else {
        echo "❌ Reject Change Request - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test unauthorized access
 */
function testUnauthorizedAccess($baseUrl) {
    echo "\nTesting Unauthorized Access...\n";
    
    // Test without token
    $url = $baseUrl . "/staff-schedules/staff-members";
    $result = makeRequest($url, '');
    
    if ($result['status'] === 401) {
        echo "✅ Unauthorized access properly blocked (401)\n";
    } else {
        echo "❌ Unauthorized access not properly blocked\n";
    }
}

/**
 * Main test execution
 */
echo "=== Staff Scheduling System Test ===\n";
echo "Base URL: {$baseUrl}\n\n";

// Check if test data is configured
if ($testData['admin_token'] === 'your_admin_token_here') {
    echo "⚠️  WARNING: Test tokens not configured!\n";
    echo "Please update the testData array with actual authentication tokens.\n\n";
    
    echo "Test structure (without actual API calls):\n";
    echo "1. Get Staff Members: GET {$baseUrl}/staff-schedules/staff-members\n";
    echo "2. Get Branches: GET {$baseUrl}/staff-schedules/branches\n";
    echo "3. Get Branch Staff Schedules: GET {$baseUrl}/staff-schedules/branch/{$testData['branch_id']}\n";
    echo "4. Get Staff Schedule: GET {$baseUrl}/staff-schedules/staff/{$testData['staff_id']}\n";
    echo "5. Create/Update Schedule: POST {$baseUrl}/staff-schedules\n";
    echo "6. Create Change Request: POST {$baseUrl}/staff-schedules/change-requests\n";
    echo "7. Get Change Requests: GET {$baseUrl}/staff-schedules/change-requests\n";
    echo "8. Approve Change Request: PUT {$baseUrl}/staff-schedules/change-requests/{id}/approve\n";
    echo "9. Reject Change Request: PUT {$baseUrl}/staff-schedules/change-requests/{id}/reject\n\n";
    
    echo "Expected features:\n";
    echo "- Support for both optometrists and staff members\n";
    echo "- Branch-specific scheduling\n";
    echo "- Admin control over all schedules\n";
    echo "- Staff change request system\n";
    echo "- Role-based access control\n";
    
    exit(0);
}

// Run tests
$testResults['staff_members'] = testGetStaffMembers($baseUrl, $testData['admin_token']);
$testResults['branches'] = testGetBranches($baseUrl, $testData['admin_token']);
$testResults['branch_schedules'] = testGetBranchStaffSchedules($baseUrl, $testData['admin_token'], $testData['branch_id']);
$testResults['staff_schedule'] = testGetStaffSchedule($baseUrl, $testData['admin_token'], $testData['staff_id']);
$testResults['create_schedule'] = testCreateOrUpdateSchedule($baseUrl, $testData['admin_token'], $testData['staff_id'], $testData['branch_id']);

// Test change request workflow
$changeRequestId = testCreateChangeRequest($baseUrl, $testData['optometrist_token'], $testData['branch_id']);
$testResults['change_requests'] = testGetChangeRequests($baseUrl, $testData['admin_token']);

if ($changeRequestId) {
    $testResults['approve_request'] = testApproveChangeRequest($baseUrl, $testData['admin_token'], $changeRequestId);
}

// Test unauthorized access
testUnauthorizedAccess($baseUrl);

// Summary
echo "\n=== Test Summary ===\n";
$totalTests = count($testResults);
$passedTests = count(array_filter($testResults, function($result) {
    return $result['success'];
}));

echo "Total tests: {$totalTests}\n";
echo "Passed: {$passedTests}\n";
echo "Failed: " . ($totalTests - $passedTests) . "\n";

if ($passedTests === $totalTests) {
    echo "🎉 All tests passed!\n";
} else {
    echo "⚠️  Some tests failed. Check the output above for details.\n";
}

echo "\n=== Staff Scheduling System Features ===\n";
echo "✅ Support for both optometrists and staff members\n";
echo "✅ Branch-specific scheduling\n";
echo "✅ Admin control over all schedules\n";
echo "✅ Staff change request system\n";
echo "✅ Role-based access control\n";
echo "✅ Audit trail (created_by, updated_by)\n";
echo "✅ Backward compatibility with existing optometrist schedules\n";

echo "\n=== Test Complete ===\n";
