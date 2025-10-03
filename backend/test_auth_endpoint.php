<?php

// Simple test endpoint to debug authentication
// Add this to routes/api.php temporarily for testing

echo "=== Authentication Debug Endpoint ===\n\n";

echo "Add this route to your routes/api.php file:\n\n";

echo "Route::middleware('auth:sanctum')->get('debug-auth', function () {\n";
echo "    \$user = auth()->user();\n";
echo "    return response()->json([\n";
echo "        'authenticated' => true,\n";
echo "        'user_id' => \$user->id,\n";
echo "        'user_name' => \$user->name,\n";
echo "        'user_role' => \$user->role->value,\n";
echo "        'user_email' => \$user->email,\n";
echo "        'token_valid' => true,\n";
echo "        'timestamp' => now()->toISOString()\n";
echo "    ]);\n";
echo "});\n\n";

echo "Then test with:\n";
echo "GET http://localhost:8000/api/debug-auth\n";
echo "Headers: Authorization: Bearer YOUR_TOKEN\n\n";

echo "This will help identify if:\n";
echo "1. The token is valid\n";
echo "2. The user is properly authenticated\n";
echo "3. The user has the correct role\n";
echo "4. The Sanctum middleware is working\n\n";

echo "=== Debug Endpoint Code ===\n";
