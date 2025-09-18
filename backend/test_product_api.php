<?php
// Test script for Product API endpoints with multiple image uploads

function testGetProducts() {
    echo "Testing GET /api/products...\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/products');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "Status: $httpCode\n";
    echo "Response: " . substr($response, 0, 200) . "...\n\n";
    return $httpCode == 200;
}

function testCreateProduct() {
    echo "Testing POST /api/products (create with multiple images)...\n";

    // Create a temporary image file for testing
    $tempImage = tempnam(sys_get_temp_dir(), 'test_image');
    $imageContent = base64_decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AB//2Q==');
    file_put_contents($tempImage . '.jpg', $imageContent);

    $postData = [
        'name' => 'Test Product with Multiple Images',
        'description' => 'This is a test product to verify multiple image upload functionality',
        'price' => 99.99,
        'category' => 'Test Category',
        'stock_quantity' => 10,
        'is_active' => true
    ];

    $boundary = '----FormBoundary' . md5(time());
    $body = '';

    // Add form fields
    foreach ($postData as $key => $value) {
        $body .= "--$boundary\r\n";
        $body .= "Content-Disposition: form-data; name=\"$key\"\r\n\r\n";
        $body .= "$value\r\n";
    }

    // Add multiple image files
    for ($i = 1; $i <= 3; $i++) {
        $body .= "--$boundary\r\n";
        $body .= "Content-Disposition: form-data; name=\"images[]\"; filename=\"test_image_$i.jpg\"\r\n";
        $body .= "Content-Type: image/jpeg\r\n\r\n";
        $body .= $imageContent . "\r\n";
    }

    $body .= "--$boundary--\r\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/products');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        "Content-Type: multipart/form-data; boundary=$boundary"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Clean up temp file
    @unlink($tempImage . '.jpg');

    echo "Status: $httpCode\n";
    echo "Response: " . substr($response, 0, 300) . "...\n\n";

    $responseData = json_decode($response, true);
    return $httpCode == 201 && isset($responseData['product']);
}

function testUpdateProduct() {
    echo "Testing PUT /api/products/{id} (update with images)...\n";

    // First get a product ID
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/products');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    $products = json_decode($response, true);
    if (empty($products)) {
        echo "No products found to update\n\n";
        return false;
    }

    $productId = $products[0]['id'];

    $postData = [
        'name' => 'Updated Test Product',
        'description' => 'Updated description',
        'price' => 149.99,
        'category' => 'Updated Category',
        'stock_quantity' => 15,
        'is_active' => true
    ];

    $boundary = '----FormBoundary' . md5(time());
    $body = '';

    // Add form fields
    foreach ($postData as $key => $value) {
        $body .= "--$boundary\r\n";
        $body .= "Content-Disposition: form-data; name=\"$key\"\r\n\r\n";
        $body .= "$value\r\n";
    }

    $body .= "--$boundary--\r\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/products/$productId");
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        "Content-Type: multipart/form-data; boundary=$boundary"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "Status: $httpCode\n";
    echo "Response: " . substr($response, 0, 300) . "...\n\n";
    return $httpCode == 200;
}

function testDeleteProduct() {
    echo "Testing DELETE /api/products/{id}...\n";

    // First get a product ID
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/products');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    $products = json_decode($response, true);
    if (empty($products)) {
        echo "No products found to delete\n\n";
        return false;
    }

    $productId = $products[0]['id'];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/products/$productId");
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "Status: $httpCode\n";
    echo "Response: " . substr($response, 0, 200) . "...\n\n";
    return $httpCode == 200;
}

// Run tests
echo "=== Product API Testing ===\n\n";

$tests = [
    'testGetProducts' => testGetProducts(),
    'testCreateProduct' => testCreateProduct(),
    'testUpdateProduct' => testUpdateProduct(),
    'testDeleteProduct' => testDeleteProduct()
];

echo "=== Test Results ===\n";
$passed = 0;
$total = count($tests);

foreach ($tests as $testName => $result) {
    $status = $result ? '✅ PASS' : '❌ FAIL';
    echo "$testName: $status\n";
    if ($result) $passed++;
}

echo "\nPassed: $passed/$total tests\n";

if ($passed == $total) {
    echo "🎉 All tests passed!\n";
} else {
    echo "⚠️  Some tests failed. Please check the implementation.\n";
}
?>
