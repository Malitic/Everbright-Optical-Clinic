<?php
// Create a product with an existing image path to test display

$pdo = new PDO('mysql:host=127.0.0.1;dbname=everbright_optical', 'root', '');
$stmt = $pdo->prepare("
    INSERT INTO products (name, description, price, stock_quantity, category, brand, model, image_paths, is_active, created_by, updated_by, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
");

$name = 'Test Product with Existing Image';
$description = 'Testing image display with existing image';
$price = '299.99';
$stock_quantity = '25';
$category = 'Frames';
$brand = 'Test Brand';
$model = 'Test Model';
$imagePaths = json_encode(['products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg']);
$is_active = '1';

$stmt->execute([$name, $description, $price, $stock_quantity, $category, $brand, $model, $imagePaths, $is_active]);

echo "Product created with ID: " . $pdo->lastInsertId() . "\n";
echo "Image path: products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg\n";
?>
