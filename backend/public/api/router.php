<?php
// Generic API router for common endpoints
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
    
    // Get the endpoint from the URL
    $path = $_SERVER['REQUEST_URI'];
    $path = str_replace('/api/', '', $path);
    $path = str_replace('.php', '', $path);
    
    // Route to appropriate handler
    switch ($path) {
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
            $response = [
                'data' => [],
                'message' => 'Users retrieved successfully'
            ];
            break;
            
        default:
            $response = [
                'data' => [],
                'message' => 'Endpoint not implemented yet'
            ];
            break;
    }
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
}
?>


