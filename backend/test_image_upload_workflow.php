<?php
// Test the complete image upload and display workflow

echo "=== Testing Image Upload and Display Workflow ===\n\n";

// Test 1: Check if storage directory exists and is writable
$storageDir = __DIR__ . '/storage/app/public/products/';
echo "1. Checking storage directory...\n";
echo "   Directory: " . $storageDir . "\n";
echo "   Exists: " . (is_dir($storageDir) ? 'YES' : 'NO') . "\n";
echo "   Writable: " . (is_writable($storageDir) ? 'YES' : 'NO') . "\n\n";

// Test 2: Check existing products and their image_paths
echo "2. Checking existing products...\n";
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;dbname=everbright_optical;charset=utf8mb4",
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    $stmt = $pdo->query("SELECT id, name, image_paths FROM products WHERE image_paths IS NOT NULL ORDER BY id DESC LIMIT 3");
    $products = $stmt->fetchAll();
    
    foreach ($products as $product) {
        echo "   Product ID: " . $product['id'] . ", Name: " . $product['name'] . "\n";
        echo "   Image Paths: " . $product['image_paths'] . "\n";
        
        // Parse the JSON string
        $imagePaths = json_decode($product['image_paths'], true);
        if (is_array($imagePaths)) {
            foreach ($imagePaths as $imagePath) {
                $fullPath = $storageDir . basename($imagePath);
                echo "   - " . $imagePath . " -> " . (file_exists($fullPath) ? 'EXISTS' : 'MISSING') . "\n";
            }
        }
        echo "\n";
    }
    
} catch (PDOException $e) {
    echo "   Database error: " . $e->getMessage() . "\n\n";
}

// Test 3: Test image URL construction
echo "3. Testing image URL construction...\n";
$testImagePath = "products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg";
$apiBaseUrl = 'http://127.0.0.1:8000/api-mysql.php';
$baseUrl = str_replace('/api-mysql.php', '', $apiBaseUrl);
$cleanPath = ltrim($testImagePath, '/');
$constructedUrl = $baseUrl . '/storage/' . $cleanPath;

echo "   Test image path: " . $testImagePath . "\n";
echo "   Constructed URL: " . $constructedUrl . "\n";

// Test if the URL is accessible
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $constructedUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   HTTP Code: " . $httpCode . "\n";
echo "   Accessible: " . ($httpCode == 200 ? 'YES' : 'NO') . "\n\n";

// Test 4: Check if the API endpoint works
echo "4. Testing API endpoint...\n";
$apiUrl = 'http://127.0.0.1:8000/api-mysql.php/products';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Origin: http://192.168.100.6:5173']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   API URL: " . $apiUrl . "\n";
echo "   HTTP Code: " . $httpCode . "\n";
if ($httpCode == 200) {
    $data = json_decode($response, true);
    if (isset($data['data']) && count($data['data']) > 0) {
        $firstProduct = $data['data'][0];
        echo "   First product: " . $firstProduct['name'] . "\n";
        echo "   Has images: " . (!empty($firstProduct['image_paths']) ? 'YES' : 'NO') . "\n";
    }
}

echo "\n=== Test Complete ===\n";
?>
