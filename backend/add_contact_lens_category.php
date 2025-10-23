<?php

// Add Contact Lens category to existing categories
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Add Contact Lens category
    $stmt = $pdo->prepare("INSERT INTO product_categories (name, description) VALUES (?, ?)");
    $stmt->execute(['Contact Lens', 'Contact lenses and related products']);
    echo "✅ Contact Lens category added!\n";
    
    // Verify all categories
    $stmt = $pdo->query("SELECT * FROM product_categories ORDER BY name");
    $categories = $stmt->fetchAll();
    echo "\nCurrent categories:\n";
    foreach ($categories as $category) {
        echo "- {$category['id']}: {$category['name']} - {$category['description']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
