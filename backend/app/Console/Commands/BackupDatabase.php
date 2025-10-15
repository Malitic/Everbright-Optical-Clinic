<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup {--now : Force immediate backup}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup the SQLite database with automatic rotation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!env('DB_BACKUP_ENABLED', true)) {
            $this->warn('⚠️ Database backups are disabled in .env');
            $this->line('Set DB_BACKUP_ENABLED=true to enable backups');
            return 1;
        }

        $this->info('🔄 Starting database backup...');

        // Get database path
        $dbPath = env('DB_DATABASE', database_path('database.sqlite'));
        
        // Handle relative paths
        if (!File::exists($dbPath)) {
            $dbPath = base_path('backend/database/database.sqlite');
        }
        
        if (!File::exists($dbPath)) {
            $this->error('❌ Database file not found at: ' . $dbPath);
            return 1;
        }
        
        // Create backup directory
        $backupDir = storage_path('backups/database');
        
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
            $this->line('📁 Created backup directory');
        }
        
        // Generate backup filename with timestamp
        $timestamp = now()->format('Y-m-d_H-i-s');
        $backupName = "database_backup_{$timestamp}.sqlite";
        $backupPath = "{$backupDir}/{$backupName}";
        
        // Copy database file
        try {
            if (File::copy($dbPath, $backupPath)) {
                $size = File::size($backupPath);
                $sizeInMB = round($size / 1048576, 2);
                
                $this->info("✅ Database backed up successfully!");
                $this->newLine();
                $this->line("   📄 File: {$backupName}");
                $this->line("   📊 Size: {$sizeInMB} MB");
                $this->line("   📂 Location: {$backupPath}");
                $this->newLine();
                
                // Clean old backups
                $this->cleanOldBackups($backupDir);
                
                return 0;
            } else {
                $this->error("❌ Failed to backup database");
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("❌ Backup failed: " . $e->getMessage());
            return 1;
        }
    }
    
    /**
     * Clean old backups based on retention policy
     */
    private function cleanOldBackups($dir)
    {
        $retentionDays = env('DB_BACKUP_RETENTION_DAYS', 30);
        $files = File::glob("{$dir}/database_backup_*.sqlite");
        
        if (empty($files)) {
            return;
        }
        
        $now = time();
        $deleted = 0;
        $totalSize = 0;
        
        foreach ($files as $file) {
            $age = ($now - File::lastModified($file)) / 86400; // Convert to days
            
            if ($age > $retentionDays) {
                $size = File::size($file);
                $totalSize += $size;
                File::delete($file);
                $deleted++;
            }
        }
        
        if ($deleted > 0) {
            $totalSizeInMB = round($totalSize / 1048576, 2);
            $this->line("🗑️  Cleaned {$deleted} old backup(s) (>{$retentionDays} days old)");
            $this->line("   Freed {$totalSizeInMB} MB of disk space");
        }
        
        // Show remaining backups
        $remainingFiles = File::glob("{$dir}/database_backup_*.sqlite");
        $this->newLine();
        $this->line("📦 Total backups: " . count($remainingFiles));
    }
}
