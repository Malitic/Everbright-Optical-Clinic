<?php

// Create notifications table and add sample data
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=everbright_optical', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL database 'everbright_optical'\n";
    
    // Check if notifications table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'notifications'");
    $tableExists = $stmt->fetch();
    
    if (!$tableExists) {
        echo "\nCreating notifications table...\n";
        $pdo->exec("
            CREATE TABLE notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                role VARCHAR(50),
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('unread', 'read') DEFAULT 'unread',
                type VARCHAR(100),
                data JSON,
                read_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        echo "✅ notifications table created!\n";
    } else {
        echo "\n✅ notifications table already exists\n";
    }
    
    // Add sample notifications
    $notifications = [
        [1, 'admin', 'Welcome to Everbright Optical', 'Welcome to the Everbright Optical management system!', 'unread', 'welcome', null],
        [1, 'admin', 'System Update', 'The system has been updated with new features.', 'unread', 'system', null],
        [2, 'staff', 'New Appointment', 'You have a new appointment scheduled for tomorrow.', 'unread', 'appointment', null],
        [3, 'customer', 'Order Confirmation', 'Your order has been confirmed and is being processed.', 'read', 'order', null],
        [4, 'optometrist', 'Patient Report Ready', 'The patient report is ready for review.', 'unread', 'report', null]
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, role, title, message, status, type, data) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        title = VALUES(title),
        message = VALUES(message),
        status = VALUES(status),
        type = VALUES(type)
    ");
    
    foreach ($notifications as $notification) {
        $stmt->execute($notification);
    }
    
    echo "✅ Sample notifications inserted!\n";
    
    // Verify notifications
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM notifications");
    $count = $stmt->fetch()['count'];
    echo "\nTotal notifications: $count\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM notifications WHERE status = 'unread'");
    $unreadCount = $stmt->fetch()['count'];
    echo "Unread notifications: $unreadCount\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
