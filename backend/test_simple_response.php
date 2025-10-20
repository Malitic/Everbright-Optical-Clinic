<?php

// Simple test to check if the issue is with Laravel or the specific endpoint
header('Content-Type: application/json');
echo json_encode([
    'message' => 'Test response',
    'timestamp' => date('Y-m-d H:i:s')
]);
exit;
