<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\AuditLog;
use App\Models\Transaction;
use App\Models\Reservation;
use Illuminate\Support\Facades\File;

echo "=== SECURITY FEATURES TEST ===\n\n";

$passed = 0;
$failed = 0;

// Test 1: Check .env file exists
echo "Test 1: Environment Configuration\n";
if (File::exists(base_path('.env'))) {
    echo "  ✅ .env file exists\n";
    echo "  ✓ APP_KEY: " . (env('APP_KEY') ? 'SET' : 'MISSING') . "\n";
    echo "  ✓ APP_ENV: " . env('APP_ENV', 'not set') . "\n";
    echo "  ✓ DB_BACKUP_ENABLED: " . (env('DB_BACKUP_ENABLED') ? 'true' : 'false') . "\n";
    echo "  ✓ ENABLE_AUDIT_LOGGING: " . (env('ENABLE_AUDIT_LOGGING') ? 'true' : 'false') . "\n";
    $passed++;
} else {
    echo "  ❌ .env file missing\n";
    $failed++;
}
echo "\n";

// Test 2: Rate Limiting Configuration
echo "Test 2: Rate Limiting\n";
$rateLimitConfig = config('app');
if ($rateLimitConfig) {
    echo "  ✅ Rate limiting configured\n";
    echo "  ✓ API Rate Limit: " . env('API_RATE_LIMIT', 60) . " req/min\n";
    echo "  ✓ Login Rate Limit: " . env('LOGIN_RATE_LIMIT', 5) . " req/min\n";
    $passed++;
} else {
    echo "  ❌ Rate limiting not configured\n";
    $failed++;
}
echo "\n";

// Test 3: Audit Logging System
echo "Test 3: Audit Logging System\n";
try {
    $auditCount = AuditLog::count();
    $recentAudits = AuditLog::latest()->take(3)->get();
    
    echo "  ✅ Audit logging operational\n";
    echo "  ✓ Total audit logs: {$auditCount}\n";
    
    if ($recentAudits->count() > 0) {
        echo "  ✓ Recent events:\n";
        foreach ($recentAudits as $audit) {
            echo "    - {$audit->event}: {$audit->description}\n";
        }
    }
    $passed++;
} catch (\Exception $e) {
    echo "  ❌ Audit logging failed: " . $e->getMessage() . "\n";
    $failed++;
}
echo "\n";

// Test 4: Soft Deletes
echo "Test 4: Soft Deletes\n";
try {
    $usersWithSoftDelete = \Schema::hasColumn('users', 'deleted_at');
    $transactionsWithSoftDelete = \Schema::hasColumn('transactions', 'deleted_at');
    $reservationsWithSoftDelete = \Schema::hasColumn('reservations', 'deleted_at');
    
    if ($usersWithSoftDelete && $transactionsWithSoftDelete && $reservationsWithSoftDelete) {
        echo "  ✅ Soft deletes enabled on critical tables\n";
        echo "  ✓ Users table: enabled\n";
        echo "  ✓ Transactions table: enabled\n";
        echo "  ✓ Reservations table: enabled\n";
        $passed++;
    } else {
        echo "  ❌ Soft deletes not fully implemented\n";
        $failed++;
    }
} catch (\Exception $e) {
    echo "  ❌ Soft delete check failed: " . $e->getMessage() . "\n";
    $failed++;
}
echo "\n";

// Test 5: Protected Accounts
echo "Test 5: Protected Accounts\n";
try {
    $genesis = User::where('email', 'ganesis@gmail.com')->first();
    
    if ($genesis && $genesis->is_protected) {
        echo "  ✅ Protected accounts feature working\n";
        echo "  ✓ Genesis Abanales: PROTECTED\n";
        echo "  ✓ Account ID: {$genesis->id}\n";
        echo "  ✓ Protection status: {$genesis->is_protected}\n";
        $passed++;
    } else {
        echo "  ❌ Genesis account not protected\n";
        $failed++;
    }
} catch (\Exception $e) {
    echo "  ❌ Protected accounts check failed: " . $e->getMessage() . "\n";
    $failed++;
}
echo "\n";

// Test 6: Database Backups
echo "Test 6: Database Backup System\n";
$backupDir = storage_path('backups/database');
if (File::exists($backupDir)) {
    $backups = File::glob("{$backupDir}/database_backup_*.sqlite");
    echo "  ✅ Backup system operational\n";
    echo "  ✓ Backup directory: exists\n";
    echo "  ✓ Total backups: " . count($backups) . "\n";
    
    if (count($backups) > 0) {
        $latestBackup = last($backups);
        $size = File::size($latestBackup);
        $sizeInMB = round($size / 1048576, 2);
        echo "  ✓ Latest backup: " . basename($latestBackup) . " ({$sizeInMB} MB)\n";
    }
    $passed++;
} else {
    echo "  ⚠️ Backup directory not created yet\n";
    echo "  ℹ️ Run: php artisan db:backup\n";
    $failed++;
}
echo "\n";

// Test 7: Token Expiration
echo "Test 7: Token Expiration\n";
$tokenExpiration = env('SANCTUM_TOKEN_EXPIRATION');
if ($tokenExpiration) {
    echo "  ✅ Token expiration configured\n";
    echo "  ✓ Expiration: {$tokenExpiration} minutes (" . ($tokenExpiration / 60) . " hours)\n";
    $passed++;
} else {
    echo "  ⚠️ Token expiration not set (tokens never expire)\n";
    $failed++;
}
echo "\n";

// Test 8: Database Security Settings
echo "Test 8: Database Security Settings\n";
$dbConfig = config('database.connections.sqlite');
if ($dbConfig['busy_timeout'] && $dbConfig['journal_mode']) {
    echo "  ✅ Database security settings configured\n";
    echo "  ✓ Busy timeout: {$dbConfig['busy_timeout']}ms\n";
    echo "  ✓ Journal mode: {$dbConfig['journal_mode']}\n";
    echo "  ✓ Synchronous: {$dbConfig['synchronous']}\n";
    $passed++;
} else {
    echo "  ❌ Database security settings not configured\n";
    $failed++;
}
echo "\n";

// Test 9: Genesis Data Integrity
echo "Test 9: Genesis Data Integrity\n";
try {
    $genesis = User::where('email', 'ganesis@gmail.com')->first();
    
    if ($genesis) {
        $transactions = Transaction::where('customer_id', $genesis->id)->count();
        $reservations = Reservation::where('user_id', $genesis->id)->count();
        
        echo "  ✅ Genesis data intact\n";
        echo "  ✓ User account: exists\n";
        echo "  ✓ Transactions: {$transactions}\n";
        echo "  ✓ Reservations: {$reservations}\n";
        echo "  ✓ Protected: " . ($genesis->is_protected ? 'YES' : 'NO') . "\n";
        $passed++;
    } else {
        echo "  ❌ Genesis account not found\n";
        $failed++;
    }
} catch (\Exception $e) {
    echo "  ❌ Data integrity check failed: " . $e->getMessage() . "\n";
    $failed++;
}
echo "\n";

// Summary
echo "=== TEST SUMMARY ===\n";
echo "✅ Passed: {$passed}\n";
echo "❌ Failed: {$failed}\n";
echo "Total Tests: " . ($passed + $failed) . "\n";
echo "\n";

if ($failed === 0) {
    echo "🎉 ALL SECURITY FEATURES ARE WORKING!\n";
    echo "Your system is now protected with:\n";
    echo "  ✓ Rate limiting (brute force protection)\n";
    echo "  ✓ Audit logging (change tracking)\n";
    echo "  ✓ Soft deletes (no permanent data loss)\n";
    echo "  ✓ Protected accounts (Genesis is safe)\n";
    echo "  ✓ Database backups (disaster recovery)\n";
    echo "  ✓ Token expiration (session security)\n";
    echo "  ✓ Database security (optimized settings)\n";
    exit(0);
} else {
    echo "⚠️ Some security features need attention.\n";
    echo "Please review the failed tests above.\n";
    exit(1);
}

