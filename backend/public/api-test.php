<?php
// Simple API test endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Handle different endpoints
if (strpos($path, '/login') !== false && $method === 'POST') {
    // Simulate login endpoint
    $input = json_decode(file_get_contents('php://input'), true);
    
    $response = [
        'status' => 'success',
        'message' => 'Login endpoint working',
        'method' => $method,
        'path' => $path,
        'received_data' => $input,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
} else if (strpos($path, '/db-test') !== false && $method === 'GET') {
    // Simulate database test endpoint
    $response = [
        'status' => 'success',
        'message' => 'Database test endpoint working',
        'method' => $method,
        'path' => $path,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
} else {
    // Default response
    $response = [
        'status' => 'info',
        'message' => 'API test endpoint',
        'method' => $method,
        'path' => $path,
        'available_endpoints' => [
            'POST /login' => 'Test login endpoint',
            'GET /db-test' => 'Test database endpoint'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
}
?>
