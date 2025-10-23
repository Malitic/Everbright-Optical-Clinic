<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=everbright_optical', 'root', '');
$stmt = $pdo->query('SELECT id, name, image_paths FROM products WHERE image_paths IS NOT NULL AND image_paths != "" ORDER BY id DESC LIMIT 5');
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Products with images:\n";
foreach ($products as $product) {
    echo "ID: {$product['id']}, Name: {$product['name']}, Images: {$product['image_paths']}\n";
}

echo "\nTotal products with images: " . count($products) . "\n";
?>
