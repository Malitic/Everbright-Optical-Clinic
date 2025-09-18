<?php

// Test Product Gallery Functionality
echo "=== Testing Product Gallery Functionality ===\n\n";

$baseUrl = 'http://localhost:8000/api';

// Test 1: Get products (should return empty array initially)
echo "1. Testing GET /api/products\n";
$response = file_get_contents($baseUrl . '/products');
$products = json_decode($response, true);
echo "Response: " . $response . "\n";
echo "Products count: " . count($products) . "\n\n";

// Test 2: Register a test user (admin role)
echo "2. Registering test admin user\n";
$adminData = [
    'name' => 'Test Admin',
    'email' => 'admin@test.com',
    'password' => 'password123',
    'password_confirmation' => 'password123',
    'role' => 'admin'
];

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode($adminData)
    ]
]);

$response = file_get_contents($baseUrl . '/auth/register', false, $context);
$adminResult = json_decode($response, true);
echo "Admin registration response: " . $response . "\n";

if (isset($adminResult['token'])) {
    $adminToken = $adminResult['token'];
    echo "Admin token: " . substr($adminToken, 0, 20) . "...\n\n";
    
    // Test 3: Create a product
    echo "3. Creating a test product\n";
    $productData = [
        'name' => 'Test Glasses',
        'description' => 'A test pair of glasses for testing',
        'price' => 99.99,
        'category' => 'glasses',
        'stock_quantity' => 10
    ];
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $adminToken
            ],
            'content' => json_encode($productData)
        ]
    ]);
    
    $response = file_get_contents($baseUrl . '/products', false, $context);
    $productResult = json_decode($response, true);
    echo "Product creation response: " . $response . "\n";
    
    if (isset($productResult['product'])) {
        $productId = $productResult['product']['id'];
        echo "Product created with ID: " . $productId . "\n\n";
        
        // Test 4: Get products again (should now have 1 product)
        echo "4. Getting products after creation\n";
        $response = file_get_contents($baseUrl . '/products');
        $products = json_decode($response, true);
        echo "Products count: " . count($products) . "\n";
        echo "First product: " . json_encode($products[0] ?? 'None') . "\n\n";
        
        // Test 5: Update product
        echo "5. Updating product\n";
        $updateData = [
            'name' => 'Updated Test Glasses',
            'description' => 'Updated description',
            'price' => 149.99,
            'category' => 'glasses',
            'stock_quantity' => 15
        ];
        
        $context = stream_context_create([
            'http' => [
                'method' => 'PUT',
                'header' => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $adminToken
                ],
                'content' => json_encode($updateData)
            ]
        ]);
        
        $response = file_get_contents($baseUrl . '/products/' . $productId, false, $context);
        $updateResult = json_decode($response, true);
        echo "Product update response: " . $response . "\n\n";
        
        // Test 6: Delete product
        echo "6. Deleting product\n";
        $context = stream_context_create([
            'http' => [
                'method' => 'DELETE',
                'header' => [
                    'Authorization: Bearer ' . $adminToken
                ]
            ]
        ]);
        
        $response = file_get_contents($baseUrl . '/products/' . $productId, false, $context);
        echo "Product deletion response: " . $response . "\n\n";
        
        // Test 7: Verify product is deleted
        echo "7. Verifying product deletion\n";
        $response = file_get_contents($baseUrl . '/products');
        $products = json_decode($response, true);
        echo "Products count after deletion: " . count($products) . "\n";
        
    } else {
        echo "Failed to create product\n";
    }
} else {
    echo "Failed to register admin user\n";
}

echo "\n=== Product Gallery Test Complete ===\n";
