<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    /**
     * Boot the auditable trait
     */
    public static function bootAuditable()
    {
        // Log when a model is created
        static::created(function ($model) {
            if (env('ENABLE_AUDIT_LOGGING', true)) {
                $model->auditEvent('created');
            }
        });

        // Log when a model is updated
        static::updated(function ($model) {
            if (env('ENABLE_AUDIT_LOGGING', true)) {
                $model->auditEvent('updated');
            }
        });

        // Log when a model is deleted (soft or hard delete)
        static::deleted(function ($model) {
            if (env('ENABLE_AUDIT_LOGGING', true)) {
                $model->auditEvent('deleted');
            }
        });
    }

    /**
     * Create an audit log entry for the event
     */
    protected function auditEvent(string $event): void
    {
        try {
            $user = Auth::user();
            
            // Get old and new values
            $oldValues = null;
            $newValues = null;
            
            if ($event === 'updated') {
                $oldValues = $this->getOriginal();
                $newValues = $this->getAttributes();
                
                // Remove sensitive fields from logging
                $oldValues = $this->filterSensitiveData($oldValues);
                $newValues = $this->filterSensitiveData($newValues);
                
                // Only log if there are actual changes
                if ($oldValues === $newValues) {
                    return;
                }
            } elseif ($event === 'created') {
                $newValues = $this->filterSensitiveData($this->getAttributes());
            } elseif ($event === 'deleted') {
                $oldValues = $this->filterSensitiveData($this->getOriginal());
            }
            
            AuditLog::create([
                'auditable_type' => get_class($this),
                'auditable_id' => $this->id,
                'event' => $event,
                'user_id' => $user?->id,
                'user_role' => $user?->role?->value ?? null,
                'user_email' => $user?->email,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'description' => $this->getAuditDescription($event),
            ]);
        } catch (\Exception $e) {
            // Log error but don't break the application
            \Log::error('Audit logging failed: ' . $e->getMessage());
        }
    }

    /**
     * Generate a human-readable description for the audit log
     */
    protected function getAuditDescription(string $event): string
    {
        $user = Auth::user();
        $userName = $user?->name ?? 'System';
        $modelName = class_basename($this);
        $identifier = $this->getAuditIdentifier();
        
        $descriptions = [
            'created' => "{$userName} created {$modelName} {$identifier}",
            'updated' => "{$userName} updated {$modelName} {$identifier}",
            'deleted' => "{$userName} deleted {$modelName} {$identifier}",
        ];
        
        return $descriptions[$event] ?? "{$userName} performed {$event} on {$modelName} {$identifier}";
    }

    /**
     * Get a human-readable identifier for the model
     */
    protected function getAuditIdentifier(): string
    {
        // Try common identifier fields
        if (isset($this->attributes['name'])) {
            return "'{$this->attributes['name']}' (#{$this->id})";
        }
        
        if (isset($this->attributes['email'])) {
            return "'{$this->attributes['email']}' (#{$this->id})";
        }
        
        if (isset($this->attributes['title'])) {
            return "'{$this->attributes['title']}' (#{$this->id})";
        }
        
        return "#{$this->id}";
    }

    /**
     * Filter out sensitive data from audit logs
     */
    protected function filterSensitiveData(array $data): array
    {
        $sensitiveFields = [
            'password',
            'remember_token',
            'api_token',
            'secret',
            'private_key',
        ];
        
        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[FILTERED]';
            }
        }
        
        return $data;
    }

    /**
     * Get audit logs for this model
     */
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    /**
     * Log a custom audit event
     */
    public function logAuditEvent(string $event, ?array $newValues = null, ?string $description = null): void
    {
        if (!env('ENABLE_AUDIT_LOGGING', true)) {
            return;
        }
        
        $user = Auth::user();
        
        AuditLog::create([
            'auditable_type' => get_class($this),
            'auditable_id' => $this->id,
            'event' => $event,
            'user_id' => $user?->id,
            'user_role' => $user?->role?->value ?? null,
            'user_email' => $user?->email,
            'old_values' => null,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'description' => $description ?? $this->getAuditDescription($event),
        ]);
    }
}