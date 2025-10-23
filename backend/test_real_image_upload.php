<?php
// Test product creation with actual image upload

$url = 'http://localhost:8000/api-mysql.php/products';

// Create a test image file
$imageContent = file_get_contents('storage/app/public/products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg');
$tempFile = tempnam(sys_get_temp_dir(), 'test_upload');
file_put_contents($tempFile, $imageContent);

$postData = [
    'name' => 'Product with Real Image',
    'description' => 'Testing real image upload',
    'price' => '200.00',
    'category' => 'Frames',
    'brand' => 'Test Brand',
    'model' => 'Test Model',
    'branch_stocks' => json_encode([
        ['branch_id' => 1, 'stock_quantity' => 15]
    ]),
    'is_active' => '1'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Origin: http://192.168.100.6:5173'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

// Clean up
unlink($tempFile);
?>
