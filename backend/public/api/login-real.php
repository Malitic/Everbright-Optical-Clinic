<?php
// Standalone login API endpoint with real database connection
require_once __DIR__ . '/../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Hash;

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
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['password'], $input['role'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Email, password, and role are required']);
    exit();
}

// Connect to database directly
$email = $input['email'];
$password = $input['password'];
$role = $input['role'];

try {
    // Database connection - using MySQL
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
    
    // Query the users table for real user data
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
    $stmt->execute([$email, $role]);
    $user = $stmt->fetch();
    
    if ($user && Hash::check($password, $user['password'])) {
        // Get user's branch if they have one
        $branch = null;
        if ($user['branch_id']) {
            $stmt = $pdo->prepare("SELECT * FROM branches WHERE id = ?");
            $stmt->execute([$user['branch_id']]);
            $branch = $stmt->fetch();
        }
        
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