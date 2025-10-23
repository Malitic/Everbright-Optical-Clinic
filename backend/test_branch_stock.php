<?php
// Test branch-stock endpoint directly

$host = '127.0.0.1';
$username = 'root';
$password = '';
$dbname = 'everbright_optical';

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    echo "Testing branch-stock query...\n";
    
    // Test the query step by step
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM branch_stock");
    $count = $stmt->fetch()['count'];
    echo "Branch stock records: {$count}\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM branches");
    $branchCount = $stmt->fetch()['count'];
    echo "Branches: {$branchCount}\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $productCount = $stmt->fetch()['count'];
    echo "Products: {$productCount}\n";
    
    // Test the actual query
    $stmt = $pdo->query("
        SELECT bs.*, b.name as branch_name, b.code as branch_code, p.name as product_name
        FROM branch_stock bs
        LEFT JOIN branches b ON bs.branch_id = b.id
        LEFT JOIN products p ON bs.product_id = p.id
        ORDER BY bs.product_id, bs.branch_id
        LIMIT 5
    ");
    $stockRecords = $stmt->fetchAll();
    
    echo "Query successful! Found " . count($stockRecords) . " records\n";
    
    foreach ($stockRecords as $record) {
        echo "- Product: {$record['product_name']}, Branch: {$record['branch_name']}, Stock: {$record['stock_quantity']}\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
