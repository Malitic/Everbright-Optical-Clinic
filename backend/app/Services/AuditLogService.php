<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Audit Logging Service
 * Tracks all sensitive data access and modifications
 * CRITICAL: For compliance and security monitoring
 */
class AuditLogService
{
    /**
     * Log data access
     */
    public static function logAccess(string $model, int $modelId, string $action, ?int $userId = null): void
    {
        try {
            DB::table('audit_logs')->insert([
                'user_id' => $userId ?? auth()->id(),
                'model_type' => $model,
                'model_id' => $modelId,
                'action' => $action,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Fail silently but log error
            Log::error('Audit log failed', [
                'error' => $e->getMessage(),
                'model' => $model,
                'action' => $action
            ]);
        }
    }

    /**
     * Log data modification with before/after values
     */
    public static function logModification(
        string $model, 
        int $modelId, 
        string $action, 
        array $before = [], 
        array $after = []
    ): void {
        try {
            DB::table('audit_logs')->insert([
                'user_id' => auth()->id(),
                'model_type' => $model,
                'model_id' => $modelId,
                'action' => $action,
                'old_values' => json_encode($before),
                'new_values' => json_encode($after),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Audit log modification failed', [
                'error' => $e->getMessage(),
                'model' => $model,
                'action' => $action
            ]);
        }
    }

    /**
     * Log suspicious activity
     */
    public static function logSuspiciousActivity(string $description, array $context = []): void
    {
        try {
            Log::warning('SUSPICIOUS ACTIVITY', [
                'user_id' => auth()->id(),
                'description' => $description,
                'context' => $context,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'timestamp' => now()
            ]);

            DB::table('audit_logs')->insert([
                'user_id' => auth()->id(),
                'model_type' => 'security',
                'model_id' => null,
                'action' => 'suspicious_activity',
                'new_values' => json_encode([
                    'description' => $description,
                    'context' => $context
                ]),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::critical('Failed to log suspicious activity', [
                'error' => $e->getMessage()
            ]);
        }
    }
}


