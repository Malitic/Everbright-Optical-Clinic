<?php
// Test the getStorageUrl function logic

$path = 'products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg';

// Simulate the getStorageUrl function logic
$apiBaseUrl = 'http://127.0.0.1:8000/api-mysql.php';
$baseUrl = str_replace('/api-mysql.php', '', $apiBaseUrl);
$cleanPath = $path; // path doesn't start with /

$constructedUrl = $baseUrl . '/storage/' . $cleanPath;

echo "Original path: $path\n";
echo "API Base URL: $apiBaseUrl\n";
echo "Base URL: $baseUrl\n";
echo "Constructed URL: $constructedUrl\n";

// Test if this URL works
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $constructedUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request only
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Origin: http://192.168.100.6:5173']);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "URL accessible: " . ($httpCode === 200 ? 'YES' : 'NO') . "\n";
?>
