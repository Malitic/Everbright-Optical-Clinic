<?php
// Clean up test products and create a proper product for customer gallery

$pdo = new PDO('mysql:host=127.0.0.1;dbname=everbright_optical', 'root', '');

// Delete test products (IDs 22, 23, 25)
$pdo->exec("DELETE FROM products WHERE id IN (22, 23, 25)");
echo "Deleted test products (IDs 22, 23, 25)\n";

// Create a proper product for customer gallery
$stmt = $pdo->prepare("
    INSERT INTO products (name, description, price, stock_quantity, category, brand, model, image_paths, is_active, created_by, updated_by, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
");

$name = 'Premium Eyeglass Frames';
$description = 'High-quality eyeglass frames with modern design and comfortable fit. Perfect for daily wear and professional use.';
$price = '299.99';
$stock_quantity = '50';
$category = 'Frames';
$brand = 'Everbright Optical';
$model = 'EB-2024';
$imagePaths = json_encode(['products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg']);
$is_active = '1';

$stmt->execute([$name, $description, $price, $stock_quantity, $category, $brand, $model, $imagePaths, $is_active]);

echo "Created customer product with ID: " . $pdo->lastInsertId() . "\n";
echo "Product: $name\n";
echo "Image: products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg\n";

// Show remaining products
$stmt = $pdo->query('SELECT id, name, category, image_paths FROM products WHERE is_active = 1 ORDER BY id DESC');
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nRemaining products:\n";
foreach ($products as $product) {
    $hasImage = !empty($product['image_paths']) ? 'YES' : 'NO';
    echo "ID: {$product['id']}, Name: {$product['name']}, Category: {$product['category']}, Image: $hasImage\n";
}
?>
