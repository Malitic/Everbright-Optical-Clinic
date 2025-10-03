<?php

/**
 * Test script for Role-based Analytics Endpoints
 * 
 * This script tests all the analytics endpoints for different user roles:
 * - Customer Analytics: GET /api/customers/{id}/analytics
 * - Optometrist Analytics: GET /api/optometrists/{id}/analytics
 * - Staff Analytics: GET /api/staff/{id}/analytics
 * - Admin Analytics: GET /api/admin/analytics
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Http;

// Configuration
$baseUrl = 'http://localhost:8000/api';
$testResults = [];

// Test data - you'll need to replace these with actual user IDs from your database
$testUsers = [
    'customer' => 1,      // Replace with actual customer ID
    'optometrist' => 2,   // Replace with actual optometrist ID
    'staff' => 3,         // Replace with actual staff ID
    'admin' => 4,         // Replace with actual admin ID
];

// Test tokens - you'll need to get these by logging in with each user
$testTokens = [
    'customer' => 'your_customer_token_here',
    'optometrist' => 'your_optometrist_token_here',
    'staff' => 'your_staff_token_here',
    'admin' => 'your_admin_token_here',
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
 * Test Customer Analytics
 */
function testCustomerAnalytics($baseUrl, $customerId, $token) {
    echo "Testing Customer Analytics...\n";
    
    $url = $baseUrl . "/customers/{$customerId}/analytics";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Customer Analytics - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Data includes: " . implode(', ', array_keys($result['data'])) . "\n";
        
        // Check if required fields are present
        $requiredFields = ['customer', 'vision_history', 'appointment_history', 'statistics', 'vision_trends'];
        $missingFields = array_diff($requiredFields, array_keys($result['data']));
        
        if (empty($missingFields)) {
            echo "   ✅ All required fields present\n";
        } else {
            echo "   ⚠️  Missing fields: " . implode(', ', $missingFields) . "\n";
        }
    } else {
        echo "❌ Customer Analytics - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test Optometrist Analytics
 */
function testOptometristAnalytics($baseUrl, $optometristId, $token) {
    echo "\nTesting Optometrist Analytics...\n";
    
    $url = $baseUrl . "/optometrists/{$optometristId}/analytics";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Optometrist Analytics - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Data includes: " . implode(', ', array_keys($result['data'])) . "\n";
        
        // Check if required fields are present
        $requiredFields = ['optometrist', 'period', 'appointments', 'prescriptions', 'follow_up_compliance', 'workload_distribution'];
        $missingFields = array_diff($requiredFields, array_keys($result['data']));
        
        if (empty($missingFields)) {
            echo "   ✅ All required fields present\n";
        } else {
            echo "   ⚠️  Missing fields: " . implode(', ', $missingFields) . "\n";
        }
    } else {
        echo "❌ Optometrist Analytics - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test Staff Analytics
 */
function testStaffAnalytics($baseUrl, $staffId, $token) {
    echo "\nTesting Staff Analytics...\n";
    
    $url = $baseUrl . "/staff/{$staffId}/analytics";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Staff Analytics - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Data includes: " . implode(', ', array_keys($result['data'])) . "\n";
        
        // Check if required fields are present
        $requiredFields = ['staff', 'period', 'appointments', 'sales', 'inventory', 'daily_performance'];
        $missingFields = array_diff($requiredFields, array_keys($result['data']));
        
        if (empty($missingFields)) {
            echo "   ✅ All required fields present\n";
        } else {
            echo "   ⚠️  Missing fields: " . implode(', ', $missingFields) . "\n";
        }
    } else {
        echo "❌ Staff Analytics - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test Admin Analytics
 */
function testAdminAnalytics($baseUrl, $token) {
    echo "\nTesting Admin Analytics...\n";
    
    $url = $baseUrl . "/admin/analytics";
    $result = makeRequest($url, $token);
    
    if ($result['success']) {
        echo "✅ Admin Analytics - SUCCESS\n";
        echo "   Status: {$result['status']}\n";
        echo "   Data includes: " . implode(', ', array_keys($result['data'])) . "\n";
        
        // Check if required fields are present
        $requiredFields = ['period', 'branch_performance', 'optometrist_workload', 'staff_activity', 'system_wide_stats', 'common_diagnoses'];
        $missingFields = array_diff($requiredFields, array_keys($result['data']));
        
        if (empty($missingFields)) {
            echo "   ✅ All required fields present\n";
        } else {
            echo "   ⚠️  Missing fields: " . implode(', ', $missingFields) . "\n";
        }
    } else {
        echo "❌ Admin Analytics - FAILED\n";
        echo "   Status: {$result['status']}\n";
        echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
    
    return $result;
}

/**
 * Test with different period parameters
 */
function testWithPeriods($baseUrl, $token) {
    echo "\nTesting with different period parameters...\n";
    
    $periods = [7, 30, 90];
    $endpoints = [
        'optometrists' => $testUsers['optometrist'],
        'staff' => $testUsers['staff'],
        'admin' => null,
    ];
    
    foreach ($endpoints as $endpoint => $userId) {
        foreach ($periods as $period) {
            $url = $baseUrl . "/{$endpoint}" . ($userId ? "/{$userId}" : '') . "/analytics?period={$period}";
            $result = makeRequest($url, $token);
            
            if ($result['success']) {
                echo "✅ {$endpoint} analytics with period={$period} - SUCCESS\n";
            } else {
                echo "❌ {$endpoint} analytics with period={$period} - FAILED\n";
                echo "   Error: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
            }
        }
    }
}

/**
 * Test unauthorized access
 */
function testUnauthorizedAccess($baseUrl) {
    echo "\nTesting unauthorized access...\n";
    
    // Test without token
    $url = $baseUrl . "/customers/1/analytics";
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
echo "=== Role-based Analytics Endpoints Test ===\n";
echo "Base URL: {$baseUrl}\n\n";

// Check if test data is configured
if ($testTokens['customer'] === 'your_customer_token_here') {
    echo "⚠️  WARNING: Test tokens not configured!\n";
    echo "Please update the testTokens array with actual authentication tokens.\n";
    echo "You can get these by logging in with each user role.\n\n";
    
    echo "To get tokens, you can use the login endpoint:\n";
    echo "POST {$baseUrl}/auth/login\n";
    echo "Body: {\"email\": \"user@example.com\", \"password\": \"password\", \"role\": \"customer\"}\n\n";
    
    echo "Test structure (without actual API calls):\n";
    echo "1. Customer Analytics: GET {$baseUrl}/customers/{$testUsers['customer']}/analytics\n";
    echo "2. Optometrist Analytics: GET {$baseUrl}/optometrists/{$testUsers['optometrist']}/analytics\n";
    echo "3. Staff Analytics: GET {$baseUrl}/staff/{$testUsers['staff']}/analytics\n";
    echo "4. Admin Analytics: GET {$baseUrl}/admin/analytics\n\n";
    
    echo "Expected response structure for each endpoint:\n";
    echo "- Customer: customer, vision_history, appointment_history, statistics, vision_trends\n";
    echo "- Optometrist: optometrist, period, appointments, prescriptions, follow_up_compliance, workload_distribution\n";
    echo "- Staff: staff, period, appointments, sales, inventory, daily_performance\n";
    echo "- Admin: period, branch_performance, optometrist_workload, staff_activity, system_wide_stats, common_diagnoses\n";
    
    exit(0);
}

// Run tests
$testResults['customer'] = testCustomerAnalytics($baseUrl, $testUsers['customer'], $testTokens['customer']);
$testResults['optometrist'] = testOptometristAnalytics($baseUrl, $testUsers['optometrist'], $testTokens['optometrist']);
$testResults['staff'] = testStaffAnalytics($baseUrl, $testUsers['staff'], $testTokens['staff']);
$testResults['admin'] = testAdminAnalytics($baseUrl, $testTokens['admin']);

// Test with different periods
testWithPeriods($baseUrl, $testTokens['admin']);

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

echo "\n=== Test Complete ===\n";
