<?php

// Check and create missing tables in MySQL
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Check existing tables
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "\nExisting tables:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    // Create product_categories table if it doesn't exist
    if (!in_array('product_categories', $tables)) {
        echo "\nCreating product_categories table...\n";
        $pdo->exec("
            CREATE TABLE product_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        echo "✅ product_categories table created!\n";
        
        // Insert sample categories
        $categories = [
            ['Eyeglasses', 'Prescription and reading glasses'],
            ['Sunglasses', 'UV protection sunglasses'],
            ['Contact Lenses', 'Daily and monthly contact lenses'],
            ['Frames', 'Eyeglass frames'],
            ['Lens Treatments', 'Anti-glare, blue light protection, etc.']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO product_categories (name, description) VALUES (?, ?)");
        foreach ($categories as $category) {
            $stmt->execute($category);
        }
        echo "✅ Sample categories inserted!\n";
    } else {
        echo "\n✅ product_categories table already exists\n";
    }
    
    // Create products table if it doesn't exist
    if (!in_array('products', $tables)) {
        echo "\nCreating products table...\n";
        $pdo->exec("
            CREATE TABLE products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category_id INT,
                sku VARCHAR(100),
                stock_quantity INT DEFAULT 0,
                image_url VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES product_categories(id)
            )
        ");
        echo "✅ products table created!\n";
        
        // Insert sample products
        $products = [
            ['Classic Black Frames', 'Traditional black eyeglass frames', 150.00, 4, 'FRAME-001', 50, null],
            ['Blue Light Glasses', 'Computer glasses with blue light protection', 200.00, 1, 'GLASS-001', 30, null],
            ['Aviator Sunglasses', 'Classic aviator style sunglasses', 120.00, 2, 'SUN-001', 25, null],
            ['Daily Contact Lenses', 'Comfortable daily disposable lenses', 80.00, 3, 'CONTACT-001', 100, null],
            ['Anti-Glare Coating', 'Premium anti-glare lens treatment', 50.00, 5, 'TREAT-001', 200, null]
        ];
        
        $stmt = $pdo->prepare("INSERT INTO products (name, description, price, category_id, sku, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($products as $product) {
            $stmt->execute($product);
        }
        echo "✅ Sample products inserted!\n";
    } else {
        echo "\n✅ products table already exists\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
