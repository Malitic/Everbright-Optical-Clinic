<?php

// Test script to debug prescription authentication issues
// This should be run after the backend server is started

echo "=== Testing Prescription Authentication ===\n\n";

$baseUrl = 'http://localhost:8000/api';

echo "Testing prescription endpoint: {$baseUrl}/prescriptions\n\n";

echo "Common causes of 401 Unauthorized:\n";
echo "1. Token not present in request\n";
echo "2. Token expired or invalid\n";
echo "3. Token format incorrect\n";
echo "4. Backend authentication middleware issue\n";
echo "5. User role not authorized\n\n";

echo "To debug this issue:\n\n";

echo "1. Check if token exists in browser:\n";
echo "   Open browser console and run:\n";
echo "   console.log('Token:', sessionStorage.getItem('auth_token'));\n\n";

echo "2. Check token format:\n";
echo "   Token should start with 'Bearer ' in the Authorization header\n";
echo "   Example: 'Authorization: Bearer 1|abc123...'\n\n";

echo "3. Test with curl:\n";
echo "   curl -X POST {$baseUrl}/prescriptions \\\n";
echo "     -H 'Content-Type: application/json' \\\n";
echo "     -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\\n";
echo "     -d '{\"appointment_id\": 1, \"right_eye\": {\"sphere\": \"-2.00\"}, \"left_eye\": {\"sphere\": \"-1.75\"}}'\n\n";

echo "4. Check backend logs:\n";
echo "   Look for authentication errors in Laravel logs\n";
echo "   Check if the user is properly authenticated\n\n";

echo "5. Verify user role:\n";
echo "   Make sure the user has 'optometrist' role\n";
echo "   Check the users table in the database\n\n";

echo "6. Test other endpoints:\n";
echo "   Try GET {$baseUrl}/appointments to see if auth works\n";
echo "   Try GET {$baseUrl}/prescriptions to see if auth works\n\n";

echo "Backend authentication check:\n";
echo "- Check if Sanctum middleware is working\n";
echo "- Check if the user is properly authenticated\n";
echo "- Check if the user has the correct role\n";
echo "- Check if the token is valid and not expired\n\n";

echo "Frontend authentication check:\n";
echo "- Check if token is being retrieved from sessionStorage\n";
echo "- Check if token is being sent in Authorization header\n";
echo "- Check if token format is correct (Bearer + space + token)\n";
echo "- Check if the request is being made to the correct endpoint\n\n";

echo "=== Debug Complete ===\n";
