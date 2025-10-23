<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=everbright_optical', 'root', '');
$stmt = $pdo->query('SELECT id, name, is_active FROM products ORDER BY id DESC LIMIT 10');
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "All products in database:\n";
foreach ($products as $product) {
    echo "ID: {$product['id']}, Name: {$product['name']}, Active: {$product['is_active']}\n";
}

echo "\nActive products only:\n";
$stmt = $pdo->query('SELECT id, name, is_active FROM products WHERE is_active = 1 ORDER BY id DESC LIMIT 10');
$activeProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($activeProducts as $product) {
    echo "ID: {$product['id']}, Name: {$product['name']}, Active: {$product['is_active']}\n";
}
?>
