<?php

require __DIR__.'/vendor/autoload.php';

$backups = [
    'October 11 Backup' => __DIR__ . '/storage/backups/database/database_backup_2025-10-11_18-14-40.sqlite',
    'October 14 Backup' => __DIR__ . '/storage/backups/database/database_backup_2025-10-14_16-07-25.sqlite',
];

echo "=== COMPARING BACKUP DATABASES ===\n\n";

foreach ($backups as $label => $backupPath) {
    echo "┌─────────────────────────────────────────┐\n";
    echo "│ {$label}\n";
    echo "└─────────────────────────────────────────┘\n";
    
    if (!file_exists($backupPath)) {
        echo "❌ Backup file not found!\n\n";
        continue;
    }
    
    $fileSize = round(filesize($backupPath) / 1024, 2);
    echo "File Size: {$fileSize} KB\n";
    echo "Last Modified: " . date('Y-m-d H:i:s', filemtime($backupPath)) . "\n\n";
    
    try {
        $db = new PDO('sqlite:' . $backupPath);
        
        $tables = [
            'users' => 'Users',
            'branches' => 'Branches',
            'products' => 'Products',
            'appointments' => 'Appointments',
            'prescriptions' => 'Prescriptions',
            'transactions' => 'Transactions',
            'receipts' => 'Receipts',
            'schedules' => 'Schedules',
            'feedback' => 'Feedback',
            'reservations' => 'Reservations',
        ];
        
        foreach ($tables as $table => $label) {
            $stmt = $db->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "  {$label}: {$count}\n";
        }
        
        // Show sample users
        echo "\n  Sample Users:\n";
        $stmt = $db->query("SELECT id, name, email, role FROM users ORDER BY id LIMIT 5");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as $user) {
            echo "    - {$user['name']} ({$user['email']}) - {$user['role']}\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error reading backup: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
}

