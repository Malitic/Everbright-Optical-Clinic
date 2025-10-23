<?php
// Standalone login endpoint using MySQL only (no Laravel bootstrap)
header('Content-Type: application/json');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://192.168.100.6:5173';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit();
}

// Set CORS headers for actual requests
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://192.168.100.6:5173';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['password'], $input['role'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Email, password, and role are required']);
    exit();
}

try {
    // Connect to MySQL database
    $email = $input['email'];
    $password = $input['password'];
    $role = $input['role'];
    
    $host = '127.0.0.1';
    $dbname = 'everbright_optical';
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
    
    // Query the users table
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
    $stmt->execute([$email, $role]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        // Get user's branch if they have one
        $branch = null;
        if (isset($user['branch_id']) && $user['branch_id']) {
            $stmt = $pdo->prepare("SELECT * FROM branches WHERE id = ?");
            $stmt->execute([$user['branch_id']]);
            $branch = $stmt->fetch();
        }
        
        $response = [
            'message' => 'Login successful',
            'token' => 'mysql_token_' . time(),
            'token_expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours')),
            'token_expires_in_minutes' => 1440,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'phone' => $user['phone'] ?? null,
                'address' => $user['address'] ?? null,
                'branch' => $branch ? [
                    'id' => $branch['id'],
                    'name' => $branch['name'],
                    'address' => $branch['address']
                ] : null
            ]
        ];
        
        http_response_code(200);
        echo json_encode($response);
        exit();
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid credentials']);
        exit();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
    exit();
}
?>
