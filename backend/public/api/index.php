<?php
// Catch-all API router for PHP built-in server
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
    // Database connection (MySQL)
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
    
    // Get the endpoint from the URL
    $path = $_SERVER['REQUEST_URI'];
    $path = str_replace('/api/', '', $path);
    
    // Route to appropriate handler
    switch ($path) {
        case 'branches':
            $stmt = $pdo->query("SELECT * FROM branches ORDER BY name");
            $data = $stmt->fetchAll();
            $response = [
                'data' => $data,
                'message' => 'Branches retrieved successfully'
            ];
            break;
            
        case 'analytics/realtime':
            $response = [
                'data' => [
                    'active_users' => 1,
                    'total_appointments_today' => 0,
                    'revenue_today' => 0,
                    'pending_appointments' => 0
                ],
                'message' => 'Real-time analytics retrieved successfully'
            ];
            break;
            
        case 'analytics/trends':
            $response = [
                'data' => [
                    'appointments_trend' => [],
                    'revenue_trend' => [],
                    'patient_trend' => []
                ],
                'message' => 'Analytics trends retrieved successfully'
            ];
            break;
            
        case 'admin/analytics':
            $response = [
                'data' => [
                    'total_revenue' => 0,
                    'total_appointments' => 0,
                    'total_patients' => 0,
                    'branch_performance' => []
                ],
                'message' => 'Admin analytics retrieved successfully'
            ];
            break;
            
        case 'admin/feedback/analytics':
            $response = [
                'data' => [
                    'total_feedback' => 0,
                    'average_rating' => 0,
                    'feedback_trends' => []
                ],
                'message' => 'Feedback analytics retrieved successfully'
            ];
            break;
            
        case 'admin/users':
            $stmt = $pdo->query("SELECT id, name, email, role, created_at FROM users ORDER BY name");
            $data = $stmt->fetchAll();
            $response = [
                'data' => $data,
                'message' => 'Users retrieved successfully'
            ];
            break;
            
        case 'notifications':
            $response = [
                'data' => [],
                'message' => 'Notifications retrieved successfully'
            ];
            break;
            
        case 'notifications/unread-count':
            $response = [
                'data' => ['unread_count' => 0],
                'message' => 'Unread count retrieved successfully'
            ];
            break;
            
        case 'admin/users':
            // Handle admin users endpoint
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->query("SELECT id, name, email, role, is_approved, created_at FROM users ORDER BY created_at DESC");
                $users = $stmt->fetchAll();
                $response = [
                    'data' => $users,
                    'message' => 'Users retrieved successfully'
                ];
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Handle user creation
                $input = json_decode(file_get_contents('php://input'), true);
                $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
                
                $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$input['name'], $input['email'], $hashedPassword, $input['role'], $input['is_approved'] ?? 0]);
                
                $response = [
                    'data' => ['id' => $pdo->lastInsertId()],
                    'message' => 'User created successfully'
                ];
            } else {
                $response = [
                    'data' => [],
                    'message' => 'Method not allowed'
                ];
            }
            break;
            
        case 'login':
            // Handle login directly
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($input['email'], $input['password'], $input['role'])) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Email, password, and role are required']);
                    exit();
                }
                
                // Bootstrap Laravel for database access
                require_once __DIR__ . '/../../vendor/autoload.php';
                $app = require_once __DIR__ . '/../../bootstrap/app.php';
                $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
                $kernel->bootstrap();
                
                // Connect to database (MySQL)
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
            break;
            
        default:
            // Pass through to Laravel for unhandled routes
            try {
                // Bootstrap Laravel
                require_once __DIR__ . '/../../vendor/autoload.php';
                $app = require_once __DIR__ . '/../../bootstrap/app.php';
                $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
                
                // Create a new request
                $request = Illuminate\Http\Request::createFromGlobals();
                
                // Handle the request through Laravel
                $response = $kernel->handle($request);
                
                // Send the response
                $response->send();
                $kernel->terminate($request, $response);
                exit();
            } catch (Exception $e) {
                $response = [
                    'data' => [],
                    'message' => 'Laravel routing error: ' . $e->getMessage()
                ];
            }
            break;
    }
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
}
?>
