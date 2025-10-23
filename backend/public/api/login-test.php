<?php
// Test endpoint to see exactly what the frontend is sending
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

// Log everything we receive
error_log("=== LOGIN TEST ENDPOINT ===");
error_log("Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
error_log("Raw input: " . file_get_contents('php://input'));
error_log("POST data: " . json_encode($_POST));
error_log("GET data: " . json_encode($_GET));
error_log("Headers: " . json_encode(getallheaders()));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Decoded JSON: " . json_encode($input));
    
    $response = [
        'message' => 'Test endpoint - received data',
        'received_data' => $input,
        'method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    http_response_code(200);
    echo json_encode($response);
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
?>


