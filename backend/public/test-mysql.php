<?php
// Simple test endpoint to verify MySQL connection
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=everbright_optical;charset=utf8mb4";
    $pdo = new PDO($dsn, 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test login
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['email']) && isset($input['password']) && isset($input['role'])) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = ? AND is_approved = 1");
            $stmt->execute([$input['email'], $input['role']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && password_verify($input['password'], $user['password'])) {
                echo json_encode([
                    'message' => 'Login successful',
                    'token' => 'test_token_' . time(),
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name'],
                        'email' => $user['email'],
                        'role' => $user['role']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['message' => 'Invalid credentials']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
        }
    } else {
        // GET request - return status
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'MySQL connection successful',
            'users_count' => $count['count'],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
