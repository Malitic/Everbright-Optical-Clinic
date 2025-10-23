<?php

// Test the login endpoint directly
try {
    $input = json_decode('{"email":"admin@everbright.com","password":"password123","role":"admin"}', true);
    
    if (!isset($input['email'], $input['password'], $input['role'])) {
        echo "Missing required fields\n";
        exit();
    }
    
    // Connect to database (SQLite)
    $email = $input['email'];
    $password = $input['password'];
    $role = $input['role'];
    
    $dbPath = __DIR__ . '/database/database.sqlite';
    $pdo = new PDO(
        "sqlite:{$dbPath}",
        null,
        null,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    // Query the users table
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
    $stmt->execute([$email, $role]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        echo "✅ Login successful!\n";
        echo "User: " . $user['name'] . " (" . $user['email'] . ")\n";
    } else {
        echo "❌ Login failed - Invalid credentials\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
