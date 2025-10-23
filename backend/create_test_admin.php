<?php

// Create a test user with known password in MySQL
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Check existing users
    $stmt = $pdo->query('SELECT id, name, email, role FROM users LIMIT 5');
    echo "\nExisting users:\n";
    while ($row = $stmt->fetch()) {
        echo "- " . $row['id'] . ' - ' . $row['name'] . ' - ' . $row['email'] . ' - ' . $row['role'] . "\n";
    }
    
    // Create/update a test admin user with known password
    $hashedPassword = password_hash('password123', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        INSERT INTO users (id, name, email, password, role, is_approved) 
        VALUES (999, 'Test Admin', 'test@admin.com', ?, 'admin', 1)
        ON DUPLICATE KEY UPDATE 
        password = VALUES(password), 
        name = VALUES(name),
        is_approved = VALUES(is_approved)
    ");
    $stmt->execute([$hashedPassword]);
    
    echo "\n✅ Test admin user created/updated!\n";
    echo "Email: test@admin.com\n";
    echo "Password: password123\n";
    echo "Role: admin\n";
    
    // Verify the user was created
    $stmt = $pdo->query("SELECT id, name, email, role FROM users WHERE email = 'test@admin.com'");
    $user = $stmt->fetch();
    if ($user) {
        echo "\n✅ User verified: " . $user['name'] . " (" . $user['email'] . ")\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
