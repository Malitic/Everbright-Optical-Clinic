<?php

// Update product categories to match user requirements
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Clear existing categories
    $pdo->exec("DELETE FROM product_categories");
    echo "✅ Cleared existing categories\n";
    
    // Insert the correct categories
    $categories = [
        ['Frames', 'Eyeglass frames and optical frames'],
        ['Sunglasses', 'UV protection sunglasses'],
        ['Eyecare', 'Eye care products and treatments']
    ];
    
    $stmt = $pdo->prepare("INSERT INTO product_categories (name, description) VALUES (?, ?)");
    foreach ($categories as $category) {
        $stmt->execute($category);
    }
    echo "✅ Updated categories inserted!\n";
    
    // Verify categories
    $stmt = $pdo->query("SELECT * FROM product_categories ORDER BY name");
    $categories = $stmt->fetchAll();
    echo "\nCurrent categories:\n";
    foreach ($categories as $category) {
        echo "- {$category['id']}: {$category['name']} - {$category['description']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
