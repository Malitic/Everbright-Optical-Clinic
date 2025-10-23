<?php
// Debug login endpoint to see what's being sent
header('Content-Type: application/json');

// Get the origin from the request
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins
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

try {
    // Database connection
    $host = '127.0.0.1';
    $dbname = 'everbright';
    $username = 'root';
    $password_db = '';
    
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password_db,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get input data
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Debug: Log what we received
        error_log("Login attempt: " . json_encode($input));
        
        if (!$input || !isset($input['email']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing email or password']);
            exit();
        }
        
        $email = $input['email'];
        $password = $input['password'];
        $role = $input['role'] ?? 'customer';
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            error_log("User not found: " . $email);
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials - user not found']);
            exit();
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            error_log("Password verification failed for: " . $email);
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials - password mismatch']);
            exit();
        }
        
        // Login successful
        $response = [
            'message' => 'Login successful',
            'token' => 'real_token_' . time(),
            'token_expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours')),
            'token_expires_in_minutes' => 1440,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'branch' => [
                    'id' => 1,
                    'name' => 'Main Branch',
                    'address' => '123 Main St'
                ]
            ]
        ];
        
        error_log("Login successful for: " . $email);
        http_response_code(200);
        echo json_encode($response);
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
}
?>


