<?php

/**
 * Security Setup Test Script
 * Run this to verify all security components are properly installed
 * 
 * Usage: php test_security_setup.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n";
echo "====================================\n";
echo "  SECURITY SETUP VERIFICATION\n";
echo "====================================\n\n";

$passed = 0;
$failed = 0;

// Test 1: Check if middleware exists
echo "1. Checking Middleware...\n";
if (file_exists(__DIR__.'/app/Http/Middleware/CheckRole.php')) {
    echo "   ✅ CheckRole middleware exists\n";
    $passed++;
} else {
    echo "   ❌ CheckRole middleware missing\n";
    $failed++;
}

if (file_exists(__DIR__.'/app/Http/Middleware/RateLimitApi.php')) {
    echo "   ✅ RateLimitApi middleware exists\n";
    $passed++;
} else {
    echo "   ❌ RateLimitApi middleware missing\n";
    $failed++;
}

// Test 2: Check if policies exist
echo "\n2. Checking Policies...\n";
$policies = ['PrescriptionPolicy', 'TransactionPolicy', 'UserPolicy'];
foreach ($policies as $policy) {
    if (file_exists(__DIR__."/app/Policies/{$policy}.php")) {
        echo "   ✅ {$policy} exists\n";
        $passed++;
    } else {
        echo "   ❌ {$policy} missing\n";
        $failed++;
    }
}

// Test 3: Check if services exist
echo "\n3. Checking Services...\n";
if (file_exists(__DIR__.'/app/Services/AuditLogService.php')) {
    echo "   ✅ AuditLogService exists\n";
    $passed++;
} else {
    echo "   ❌ AuditLogService missing\n";
    $failed++;
}

// Test 4: Check if traits exist
echo "\n4. Checking Traits...\n";
if (file_exists(__DIR__.'/app/Traits/Auditable.php')) {
    echo "   ✅ Auditable trait exists\n";
    $passed++;
} else {
    echo "   ❌ Auditable trait missing\n";
    $failed++;
}

// Test 5: Check if backup command exists
echo "\n5. Checking Commands...\n";
if (file_exists(__DIR__.'/app/Console/Commands/BackupDatabase.php')) {
    echo "   ✅ BackupDatabase command exists\n";
    $passed++;
} else {
    echo "   ❌ BackupDatabase command missing\n";
    $failed++;
}

// Test 6: Check if migrations exist
echo "\n6. Checking Migrations...\n";
$migrations = glob(__DIR__.'/database/migrations/*audit_logs*.php');
if (count($migrations) > 0) {
    echo "   ✅ Audit logs migration exists\n";
    $passed++;
} else {
    echo "   ❌ Audit logs migration missing\n";
    $failed++;
}

$softDeletesMigrations = glob(__DIR__.'/database/migrations/*soft_deletes*.php');
if (count($softDeletesMigrations) > 0) {
    echo "   ✅ Soft deletes migration exists\n";
    $passed++;
} else {
    echo "   ❌ Soft deletes migration missing\n";
    $failed++;
}

// Test 7: Check if models are updated
echo "\n7. Checking Models...\n";
$modelsToCheck = ['User', 'Prescription', 'Transaction', 'Receipt'];
foreach ($modelsToCheck as $model) {
    $content = file_get_contents(__DIR__."/app/Models/{$model}.php");
    if (strpos($content, 'SoftDeletes') !== false) {
        echo "   ✅ {$model} has SoftDeletes\n";
        $passed++;
    } else {
        echo "   ⚠️  {$model} missing SoftDeletes (optional)\n";
    }
    
    if (strpos($content, 'Auditable') !== false) {
        echo "   ✅ {$model} has Auditable trait\n";
        $passed++;
    } else {
        echo "   ⚠️  {$model} missing Auditable trait (optional)\n";
    }
}

// Test 8: Check if AppServiceProvider is updated
echo "\n8. Checking Provider Configuration...\n";
$providerContent = file_get_contents(__DIR__.'/app/Providers/AppServiceProvider.php');
if (strpos($providerContent, 'Gate::policy') !== false) {
    echo "   ✅ Policies registered in AppServiceProvider\n";
    $passed++;
} else {
    echo "   ❌ Policies not registered in AppServiceProvider\n";
    $failed++;
}

// Test 9: Check if bootstrap/app.php is updated
echo "\n9. Checking Middleware Registration...\n";
$bootstrapContent = file_get_contents(__DIR__.'/bootstrap/app.php');
if (strpos($bootstrapContent, 'CheckRole') !== false) {
    echo "   ✅ CheckRole middleware registered\n";
    $passed++;
} else {
    echo "   ❌ CheckRole middleware not registered\n";
    $failed++;
}

// Test 10: Check if backup directory exists
echo "\n10. Checking Directories...\n";
if (!is_dir(__DIR__.'/storage/backups')) {
    mkdir(__DIR__.'/storage/backups', 0755, true);
    echo "   ✅ Created backup directory\n";
    $passed++;
} else {
    echo "   ✅ Backup directory exists\n";
    $passed++;
}

// Test 11: Check database connection
echo "\n11. Checking Database Connection...\n";
try {
    \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "   ✅ Database connection successful\n";
    $passed++;
} catch (\Exception $e) {
    echo "   ❌ Database connection failed: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 12: Check if migrations are run
echo "\n12. Checking Migration Status...\n";
try {
    $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
    $tableNames = array_map('current', array_map('get_object_vars', $tables));
    
    if (in_array('audit_logs', $tableNames)) {
        echo "   ✅ audit_logs table exists\n";
        $passed++;
    } else {
        echo "   ⚠️  audit_logs table not created (run: php artisan migrate)\n";
    }
    
    // Check for deleted_at columns
    $columnsCheck = ['prescriptions', 'transactions', 'users', 'receipts'];
    foreach ($columnsCheck as $table) {
        if (in_array($table, $tableNames)) {
            $columns = \Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM {$table}");
            $columnNames = array_column(array_map('get_object_vars', $columns), 'Field');
            if (in_array('deleted_at', $columnNames)) {
                echo "   ✅ {$table} has deleted_at column\n";
                $passed++;
            } else {
                echo "   ⚠️  {$table} missing deleted_at column (run: php artisan migrate)\n";
            }
        }
    }
} catch (\Exception $e) {
    echo "   ⚠️  Could not check tables (run: php artisan migrate)\n";
    echo "   Error: " . $e->getMessage() . "\n";
}

// Summary
echo "\n====================================\n";
echo "  SUMMARY\n";
echo "====================================\n";
echo "✅ Passed: {$passed}\n";
if ($failed > 0) {
    echo "❌ Failed: {$failed}\n";
}
echo "\n";

if ($failed === 0) {
    echo "🎉 All security components installed!\n";
    echo "\nNext steps:\n";
    echo "1. Run: php artisan migrate\n";
    echo "2. Run: php artisan db:backup (to test backups)\n";
    echo "3. Review: SECURITY_IMPLEMENTATION_STEPS.md\n";
    echo "4. Update your routes with role middleware\n";
} else {
    echo "⚠️  Some components are missing or not configured.\n";
    echo "Please review the errors above.\n";
}

echo "\n";


