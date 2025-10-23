<?php
// Test the branch_stocks API endpoint directly

$url = 'http://localhost:8000/api-mysql.php/products';

$data = [
    'name' => 'API Test Product',
    'description' => 'Testing API directly',
    'price' => '99.99',
    'category' => 'Frames',
    'brand' => 'Test Brand',
    'model' => 'Test Model',
    'branch_stocks' => json_encode([
        ['branch_id' => 1, 'stock_quantity' => 25],
        ['branch_id' => 2, 'stock_quantity' => 15]
    ]),
    'is_active' => '1'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    'Origin: http://192.168.100.6:5173'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

// Now check if the branch stock was created
$stockUrl = 'http://localhost:8000/api-mysql.php/branch-stock';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $stockUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Origin: http://192.168.100.6:5173'
]);

$stockResponse = curl_exec($ch);
curl_close($ch);

$stockData = json_decode($stockResponse, true);
echo "\nBranch Stock Records:\n";
if (isset($stockData['stock'])) {
    foreach ($stockData['stock'] as $stock) {
        if ($stock['product_id'] >= 20) { // Show recent products
            echo "Product ID: {$stock['product_id']}, Branch ID: {$stock['branch_id']}, Stock: {$stock['stock_quantity']}\n";
        }
    }
}
?>
