<?php
// Check users in everbright database
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;dbname=everbright;charset=utf8mb4",
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    // Check if users table exists and get count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    echo "Total users in 'everbright' database: " . $result['count'] . "\n";
    
    // Get first few users
    $stmt = $pdo->query("SELECT id, name, email, role FROM users LIMIT 5");
    $users = $stmt->fetchAll();
    
    echo "Sample users:\n";
    foreach ($users as $user) {
        echo "ID: {$user['id']}, Name: {$user['name']}, Email: {$user['email']}, Role: {$user['role']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>