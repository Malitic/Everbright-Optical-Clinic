<?php
// Test image upload with product creation

$url = 'http://localhost:8000/api-mysql.php/products';

// Create a simple test image (1x1 pixel PNG)
$imageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
$tempFile = tempnam(sys_get_temp_dir(), 'test_image');
file_put_contents($tempFile, $imageData);

$postData = [
    'name' => 'Product with Image Test',
    'description' => 'Testing image upload functionality',
    'price' => '150.00',
    'category' => 'Frames',
    'brand' => 'Test Brand',
    'model' => 'Test Model',
    'branch_stocks' => json_encode([
        ['branch_id' => 1, 'stock_quantity' => 20]
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