<?php

// Check products table structure
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Check products table structure
    $stmt = $pdo->query('DESCRIBE products');
    $columns = $stmt->fetchAll();
    echo "\nProducts table structure:\n";
    foreach ($columns as $column) {
        echo "- {$column['Field']} ({$column['Type']})\n";
    }
    
    // Check if there are any products
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM products');
    $count = $stmt->fetch()['count'];
    echo "\nProducts count: $count\n";
    
    if ($count > 0) {
        $stmt = $pdo->query('SELECT * FROM products LIMIT 3');
        $products = $stmt->fetchAll();
        echo "\nSample products:\n";
        foreach ($products as $product) {
            echo "- ID: {$product['id']}, Name: {$product['name']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
