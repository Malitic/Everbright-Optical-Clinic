<?php

// Debug product creation
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Test the exact query from the API
    $name = 'Test Product';
    $description = 'Test Description';
    $price = '100.00';
    $stock_quantity = '10';
    $category = 'Eyeglasses';
    $brand = 'Test Brand';
    $model = 'Test Model';
    $sku = 'TEST-001';
    $is_active = '1';
    
    $sql = "INSERT INTO products (name, description, price, stock_quantity, category, brand, model, sku, is_active, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())";
    
    echo "SQL: $sql\n";
    echo "Params: " . json_encode([$name, $description, $price, $stock_quantity, $category, $brand, $model, $sku, $is_active]) . "\n";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$name, $description, $price, $stock_quantity, $category, $brand, $model, $sku, $is_active]);
    
    $productId = $pdo->lastInsertId();
    
    echo "✅ Product created successfully!\n";
    echo "Product ID: $productId\n";
    
    // Verify the product was created
    $stmt = $pdo->query("SELECT * FROM products WHERE id = $productId");
    $product = $stmt->fetch();
    
    if ($product) {
        echo "✅ Product verified:\n";
        echo "- Name: {$product['name']}\n";
        echo "- Category: {$product['category']}\n";
        echo "- Price: {$product['price']}\n";
        echo "- Stock: {$product['stock_quantity']}\n";
    } else {
        echo "❌ Product not found after creation\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
