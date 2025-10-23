<?php
// Add code column to branches table

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

    // Add code column to branches table
    $pdo->exec("ALTER TABLE branches ADD COLUMN code VARCHAR(50) DEFAULT NULL AFTER name");
    echo "✅ Added 'code' column to branches table!\n";

    // Update existing branches with default codes
    $branches = $pdo->query("SELECT id, name FROM branches")->fetchAll();
    
    foreach ($branches as $branch) {
        $code = strtoupper(str_replace(' ', '_', preg_replace('/[^a-zA-Z0-9\s]/', '', $branch['name'])));
        $stmt = $pdo->prepare("UPDATE branches SET code = ? WHERE id = ?");
        $stmt->execute([$code, $branch['id']]);
        echo "Updated branch '{$branch['name']}' with code '{$code}'\n";
    }

    echo "✅ All branches updated with codes!\n";

} catch (PDOException $e) {
    if ($e->getCode() == '42S21') {
        echo "✅ Code column already exists!\n";
    } else {
        die("Error: " . $e->getMessage());
    }
}
?>
