<?php

// Debug notifications query
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Test the exact query from the API
    $perPage = 20;
    $status = '';
    
    $sql = "SELECT id, user_id, role, title, message, status, type, read_at, created_at, updated_at FROM notifications WHERE 1=1";
    $params = [];
    
    if (!empty($status)) {
        $sql .= " AND status = ?";
        $params[] = $status;
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT ?";
    $params[] = (int)$perPage;
    
    echo "SQL: $sql\n";
    echo "Params: " . json_encode($params) . "\n";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notifications = $stmt->fetchAll();
    
    echo "✅ Query executed successfully!\n";
    echo "Found " . count($notifications) . " notifications\n";
    
    if (count($notifications) > 0) {
        echo "First notification:\n";
        print_r($notifications[0]);
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
