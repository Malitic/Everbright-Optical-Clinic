<?php

$dsn = 'sqlite:database/database.sqlite';
try {
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Delete if exists
    $stmt = $pdo->prepare("DELETE FROM users WHERE email = :email");
    $stmt->execute(['email' => 'admin@everbright.com']);

    // Insert
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, is_approved, created_at, updated_at) VALUES (:name, :email, :password, :role, :is_approved, :created_at, :updated_at)");
    $stmt->execute([
        'name' => 'Admin User',
        'email' => 'admin@everbright.com',
        'password' => 'password123',
        'role' => 'admin',
        'is_approved' => 1,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
    ]);

    echo "Admin user inserted successfully.\n";
    echo "Email: admin@everbright.com\n";
    echo "Password: password123\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
