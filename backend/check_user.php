<?php

$dsn = 'sqlite:database/database.sqlite';
try {
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT id, name, email, password, role, is_approved FROM users WHERE email = :email");
    $stmt->execute(['email' => 'admin@everbright.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "User found:\n";
        print_r($user);
        echo "Hashed password: " . $user['password'] . "\n";
        echo "Length: " . strlen($user['password']) . "\n";
    } else {
        echo "User not found.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
