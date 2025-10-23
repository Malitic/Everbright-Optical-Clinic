<?php

// Check MySQL database status
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Check what tables exist
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\nTables in MySQL database:\n";
    if (empty($tables)) {
        echo "- No tables found\n";
    } else {
        foreach ($tables as $table) {
            echo "- " . $table . "\n";
        }
    }
    
    // Check if users table exists and has data
    if (in_array('users', $tables)) {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM users');
        $result = $stmt->fetch();
        echo "\nUsers in MySQL: " . $result['count'] . "\n";
        
        if ($result['count'] > 0) {
            $stmt = $pdo->query('SELECT id, name, email, role FROM users LIMIT 5');
            while ($row = $stmt->fetch()) {
                echo "  " . $row['id'] . ' - ' . $row['name'] . ' - ' . $row['email'] . ' - ' . $row['role'] . "\n";
            }
        }
    } else {
        echo "\n❌ Users table does not exist in MySQL\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
