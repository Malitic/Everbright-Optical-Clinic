<?php
// Simple login API endpoint
header('Content-Type: application/json');

// Get the origin from the request
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins (matching Laravel CORS config)
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5176',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    'http://192.168.56.1:3000',
    'http://192.168.56.1:5173',
    'http://192.168.56.1:5174',
    'http://192.168.56.1:5176',
    'http://192.168.56.1:8080',
    'http://192.168.56.1:8081',
    'http://192.168.56.1:8082',
    'http://192.168.100.6:3000',
    'http://192.168.100.6:5173',
    'http://192.168.100.6:5174',
    'http://192.168.100.6:5176',
    'http://192.168.100.6:8080',
    'http://192.168.100.6:8081',
    'http://192.168.100.6:8082',
    'http://10.173.7.92:3000',
    'http://10.173.7.92:5173',
    'http://10.173.7.92:5174',
    'http://10.173.7.92:5176',
    'http://10.173.7.92:8080',
    'http://10.173.7.92:8081',
    'http://10.173.7.92:8082',
];

// Check if origin is allowed
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Default to localhost for development
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get the request data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit();
}

// Validate required fields
if (!isset($input['email']) || !isset($input['password']) || !isset($input['role'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: email, password, role']);
    exit();
}

// Connect to real database
$email = $input['email'];
$password = $input['password'];
$role = $input['role'];

try {
    // Load Laravel environment
    require_once __DIR__ . '/../../vendor/autoload.php';
    $app = require_once __DIR__ . '/../../bootstrap/app.php';
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
    
    // Use Laravel's database connection
    $db = $app['db'];
    
    // Query the users table for real user data
    $user = $db->table('users')
        ->where('email', $email)
        ->where('role', $role)
        ->first();
    
    if ($user && password_verify($password, $user->password)) {
        // Get user's branch if they have one
        $branch = null;
        if ($user->branch_id) {
            $branch = $db->table('branches')
                ->where('id', $user->branch_id)
                ->first();
        }
        
        $response = [
            'message' => 'Login successful',
            'token' => 'real_token_' . time(),
            'token_expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours')),
            'token_expires_in_minutes' => 1440,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone ?? null,
                'address' => $user->address ?? null,
                'branch' => $branch ? [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'address' => $branch->address
                ] : null
            ]
        ];
        
        http_response_code(200);
        echo json_encode($response);
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid credentials']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
}
?>
