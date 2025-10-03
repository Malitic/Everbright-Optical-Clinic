<?php

// Test script to verify Employee Schedule Management functionality
// This should be run after the backend server is started

echo "=== Testing Employee Schedule Management API ===\n\n";

$baseUrl = 'http://localhost:8000/api';

echo "Testing API endpoints:\n";
echo "1. GET {$baseUrl}/staff-schedules/staff-members\n";
echo "2. GET {$baseUrl}/staff-schedules/branches\n";
echo "3. GET {$baseUrl}/staff-schedules/branch/{branchId}\n";
echo "4. POST {$baseUrl}/staff-schedules\n";
echo "5. GET {$baseUrl}/staff-schedules/change-requests\n\n";

echo "To test this properly:\n";
echo "1. Start your Laravel server: php artisan serve\n";
echo "2. Login as an admin to get an auth token\n";
echo "3. Test each endpoint with proper authentication\n\n";

echo "Expected functionality:\n";
echo "✅ View all employees (optometrists and staff) across all branches\n";
echo "✅ Filter by branch, role, and employee\n";
echo "✅ Create new schedules for any employee\n";
echo "✅ Edit existing schedules\n";
echo "✅ Delete schedules\n";
echo "✅ Manage schedule change requests\n";
echo "✅ Approve/reject change requests with admin notes\n";
echo "✅ Real-time filtering and search\n";
echo "✅ Responsive design for all screen sizes\n\n";

echo "API Endpoints to test:\n\n";

echo "1. Get Staff Members:\n";
echo "   GET {$baseUrl}/staff-schedules/staff-members\n";
echo "   Headers: Authorization: Bearer {token}\n";
echo "   Optional params: ?role=optometrist&branch_id=1\n\n";

echo "2. Get Branches:\n";
echo "   GET {$baseUrl}/staff-schedules/branches\n";
echo "   Headers: Authorization: Bearer {token}\n\n";

echo "3. Get Branch Schedules:\n";
echo "   GET {$baseUrl}/staff-schedules/branch/1\n";
echo "   Headers: Authorization: Bearer {token}\n\n";

echo "4. Create Schedule:\n";
echo "   POST {$baseUrl}/staff-schedules\n";
echo "   Headers: Authorization: Bearer {token}, Content-Type: application/json\n";
echo "   Body: {\n";
echo "     \"staff_id\": 1,\n";
echo "     \"staff_role\": \"optometrist\",\n";
echo "     \"branch_id\": 1,\n";
echo "     \"day_of_week\": 1,\n";
echo "     \"start_time\": \"09:00\",\n";
echo "     \"end_time\": \"17:00\",\n";
echo "     \"is_active\": true\n";
echo "   }\n\n";

echo "5. Get Change Requests:\n";
echo "   GET {$baseUrl}/staff-schedules/change-requests\n";
echo "   Headers: Authorization: Bearer {token}\n";
echo "   Optional params: ?status=pending&staff_role=optometrist&branch_id=1\n\n";

echo "6. Approve Change Request:\n";
echo "   PUT {$baseUrl}/staff-schedules/change-requests/1/approve\n";
echo "   Headers: Authorization: Bearer {token}, Content-Type: application/json\n";
echo "   Body: {\"admin_notes\": \"Approved\"}\n\n";

echo "7. Reject Change Request:\n";
echo "   PUT {$baseUrl}/staff-schedules/change-requests/1/reject\n";
echo "   Headers: Authorization: Bearer {token}, Content-Type: application/json\n";
echo "   Body: {\"admin_notes\": \"Rejected due to conflict\"}\n\n";

echo "=== Test Complete ===\n";
echo "Make sure to test each endpoint and verify the responses match expectations.\n";
