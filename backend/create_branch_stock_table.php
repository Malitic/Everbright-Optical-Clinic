<?php
// Create branch_stock table for managing product stock across branches

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

    // Create branch_stock table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `branch_stock` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `product_id` bigint(20) UNSIGNED NOT NULL,
            `branch_id` bigint(20) UNSIGNED NOT NULL,
            `stock_quantity` int(11) NOT NULL DEFAULT 0,
            `reserved_quantity` int(11) NOT NULL DEFAULT 0,
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `branch_stock_product_branch_unique` (`product_id`, `branch_id`),
            KEY `branch_stock_product_id_foreign` (`product_id`),
            KEY `branch_stock_branch_id_foreign` (`branch_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    echo "✅ Branch stock table created successfully!\n";

    // Check if there are any existing products and branches to create initial stock records
    $stmt = $pdo->query("SELECT COUNT(*) as product_count FROM products");
    $productCount = $stmt->fetch()['product_count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as branch_count FROM branches");
    $branchCount = $stmt->fetch()['branch_count'];
    
    echo "📊 Found {$productCount} products and {$branchCount} branches\n";
    
    if ($productCount > 0 && $branchCount > 0) {
        // Get all products and branches
        $products = $pdo->query("SELECT id FROM products")->fetchAll();
        $branches = $pdo->query("SELECT id FROM branches")->fetchAll();
        
        $insertCount = 0;
        foreach ($products as $product) {
            foreach ($branches as $branch) {
                // Check if branch stock record already exists
                $stmt = $pdo->prepare("SELECT id FROM branch_stock WHERE product_id = ? AND branch_id = ?");
                $stmt->execute([$product['id'], $branch['id']]);
                
                if (!$stmt->fetch()) {
                    // Create initial stock record with 0 quantity
                    $stmt = $pdo->prepare("INSERT INTO branch_stock (product_id, branch_id, stock_quantity, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())");
                    $stmt->execute([$product['id'], $branch['id']]);
                    $insertCount++;
                }
            }
        }
        
        echo "✅ Created {$insertCount} initial branch stock records\n";
    }

} catch (PDOException $e) {
    die("Error: " . $e->getMessage());
}
?>
