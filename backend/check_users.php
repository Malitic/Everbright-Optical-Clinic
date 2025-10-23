<?php

try {
    $pdo = new PDO('sqlite:database/database.sqlite');
    
    // Check what tables exist
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
    echo "Tables in SQLite database:\n";
    while ($row = $stmt->fetch()) {
        echo "- " . $row['name'] . "\n";
    }
    
    // Check migrations table
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'");
    if ($stmt->fetch()) {
        echo "\nMigrations table exists. Checking migrations:\n";
        $stmt = $pdo->query('SELECT migration FROM migrations LIMIT 10');
        while ($row = $stmt->fetch()) {
            echo "- " . $row['migration'] . "\n";
        }
    } else {
        echo "\nMigrations table does not exist.\n";
    }
    
    // Check if users table exists
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    if ($stmt->fetch()) {
        echo "\nUsers table exists. Checking users:\n";
        $stmt = $pdo->query('SELECT id, name, email, role FROM users LIMIT 5');
        while ($row = $stmt->fetch()) {
            echo $row['id'] . ' - ' . $row['name'] . ' - ' . $row['email'] . ' - ' . $row['role'] . "\n";
        }
    } else {
        echo "\nUsers table does not exist.\n";
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
