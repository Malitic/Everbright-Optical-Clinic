<?php

// Test script to validate token format and authentication
// This should be run after the backend server is started

echo "=== Token Validation Test ===\n\n";

echo "Common Sanctum token issues:\n";
echo "1. Token format should be: 'Bearer 1|abc123...' (not just the token part)\n";
echo "2. Token should exist in personal_access_tokens table\n";
echo "3. Token should not be expired\n";
echo "4. User should exist and be active\n";
echo "5. Sanctum middleware should be properly configured\n\n";

echo "To debug this issue:\n\n";

echo "1. Check token format in browser:\n";
echo "   Open browser console and run:\n";
echo "   console.log('Token:', sessionStorage.getItem('auth_token'));\n";
echo "   Token should start with a number (like '1|' or '7|')\n\n";

echo "2. Check database token:\n";
echo "   SELECT * FROM personal_access_tokens WHERE token = 'YOUR_TOKEN_HASH';\n";
echo "   (Note: The token in the database is hashed, so you need to compare hashes)\n\n";

echo "3. Check if user exists:\n";
echo "   SELECT id, name, email, role FROM users WHERE id = YOUR_USER_ID;\n\n";

echo "4. Test with curl:\n";
echo "   curl -H 'Authorization: Bearer YOUR_FULL_TOKEN' http://localhost:8000/api/debug-auth\n\n";

echo "5. Check Laravel logs:\n";
echo "   tail -f storage/logs/laravel.log\n";
echo "   Look for the debug messages we added\n\n";

echo "6. Common fixes:\n";
echo "   - Log out and log back in to get a fresh token\n";
echo "   - Check if Sanctum is properly configured\n";
echo "   - Verify the token is being sent correctly\n";
echo "   - Check if the user account is active\n\n";

echo "=== Test Complete ===\n";
