<?php

// Create a simple test user directly in SQLite
try {
    $pdo = new PDO('sqlite:database/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create users table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            is_approved BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Create a test user
    $hashedPassword = password_hash('password123', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        INSERT OR REPLACE INTO users (id, name, email, password, role, is_approved) 
        VALUES (1, 'Admin User', 'admin@everbright.com', ?, 'admin', 1)
    ");
    $stmt->execute([$hashedPassword]);
    
    echo "✅ Test user created successfully!\n";
    echo "Email: admin@everbright.com\n";
    echo "Password: password123\n";
    echo "Role: admin\n";
    
    // Verify the user was created
    $stmt = $pdo->query("SELECT id, name, email, role FROM users WHERE email = 'admin@everbright.com'");
    $user = $stmt->fetch();
    if ($user) {
        echo "\n✅ User verified: " . $user['name'] . " (" . $user['email'] . ")\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
