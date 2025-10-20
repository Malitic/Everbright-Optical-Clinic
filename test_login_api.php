<?php
// Test the login API directly
echo "=== TESTING LOGIN API ===\n";

$url = 'http://127.0.0.1:8000/api/login';
$data = [
    'email' => 'admin@everbright.com',
    'password' => 'password123',
    'role' => 'admin'
];

$options = [
    'http' => [
        'header' => "Content-type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo "Error: Could not connect to API\n";
} else {
    echo "Response:\n";
    echo $result . "\n";
    
    $response = json_decode($result, true);
    if ($response && isset($response['user'])) {
        echo "\n=== USER DATA ANALYSIS ===\n";
        echo "Name: " . $response['user']['name'] . "\n";
        echo "Email: " . $response['user']['email'] . "\n";
        echo "Role (raw): " . json_encode($response['user']['role']) . "\n";
        echo "Role (type): " . gettype($response['user']['role']) . "\n";
        echo "Role (string): " . (string)$response['user']['role'] . "\n";
        
        if (is_array($response['user']['role'])) {
            echo "Role is an array/object!\n";
            if (isset($response['user']['role']['value'])) {
                echo "Role value: " . $response['user']['role']['value'] . "\n";
            }
        }
    }
}
?>
