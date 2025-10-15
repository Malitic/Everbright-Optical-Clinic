# 🔐 Comprehensive Data Security Guide for Laravel Application

## Overview
This guide ensures your **real data is protected, secure, and cannot be touched inappropriately**. All sensitive data is safeguarded at multiple layers.

---

## ✅ Security Layers Implemented

### 1. **Authentication & Authorization**
- ✅ Laravel Sanctum API tokens
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control (RBAC)
- ✅ Policy-based authorization
- ✅ Rate limiting to prevent brute force

### 2. **Data Protection**
- ✅ Mass assignment protection (`$fillable`)
- ✅ Hidden sensitive fields (`$hidden`)
- ✅ Soft deletes (data never truly deleted)
- ✅ Audit logging (all changes tracked)
- ✅ Database encryption ready

### 3. **Access Control**
- ✅ Middleware protection
- ✅ Policy enforcement
- ✅ Branch-based data isolation
- ✅ User role verification

---

## 🚀 Implementation Steps

### Step 1: Register Middleware

**File:** `backend/app/Http/Kernel.php`

Add to `$middlewareAliases`:

```php
protected $middlewareAliases = [
    // ... existing middleware
    'role' => \App\Http\Middleware\CheckRole::class,
    'rate.api' => \App\Http\Middleware\RateLimitApi::class,
];
```

### Step 2: Register Policies

**File:** `backend/app/Providers/AuthServiceProvider.php`

```php
<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Prescription;
use App\Models\Transaction;
use App\Models\User;
use App\Policies\PrescriptionPolicy;
use App\Policies\TransactionPolicy;
use App\Policies\UserPolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Prescription::class => PrescriptionPolicy::class,
        Transaction::class => TransactionPolicy::class,
        User::class => UserPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
```

### Step 3: Run Migrations

```bash
cd backend
php artisan migrate
```

This will create:
- ✅ `audit_logs` table (track all data changes)
- ✅ `deleted_at` columns (soft deletes)

### Step 4: Protect API Routes

**File:** `backend/routes/api.php`

Example of protected routes:

```php
// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes (require authentication)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Admin only
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/users', [AuthController::class, 'getAllUsers']);
        Route::post('/users/{id}/approve', [AuthController::class, 'approveUser']);
        Route::delete('/transactions/{id}/void', [TransactionController::class, 'void']);
    });
    
    // Optometrist only
    Route::middleware(['role:optometrist'])->group(function () {
        Route::post('/prescriptions', [PrescriptionController::class, 'store']);
        Route::put('/prescriptions/{id}', [PrescriptionController::class, 'update']);
    });
    
    // Staff only
    Route::middleware(['role:staff'])->group(function () {
        Route::post('/transactions', [TransactionController::class, 'store']);
        Route::get('/products/staff', [ProductController::class, 'staffIndex']);
    });
    
    // Customer only
    Route::middleware(['role:customer'])->group(function () {
        Route::get('/prescriptions/my', [PrescriptionController::class, 'myPrescriptions']);
        Route::get('/transactions/my', [TransactionController::class, 'myTransactions']);
    });
    
    // Multiple roles
    Route::middleware(['role:admin,staff,optometrist'])->group(function () {
        Route::get('/appointments', [AppointmentController::class, 'index']);
    });
});

// Rate limited public endpoints
Route::middleware(['rate.api:10,1'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});
```

### Step 5: Use Policies in Controllers

**Example:** `PrescriptionController.php`

```php
use Illuminate\Support\Facades\Gate;
use App\Services\AuditLogService;

class PrescriptionController extends Controller
{
    public function show($id)
    {
        $prescription = Prescription::findOrFail($id);
        
        // Check authorization using policy
        if (!Gate::allows('view', $prescription)) {
            AuditLogService::logSuspiciousActivity(
                'Unauthorized prescription access attempt',
                ['prescription_id' => $id]
            );
            
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }
        
        // Log legitimate access
        AuditLogService::logAccess('Prescription', $id, 'view');
        
        return response()->json($prescription);
    }
    
    public function update(Request $request, $id)
    {
        $prescription = Prescription::findOrFail($id);
        
        // Authorize with policy
        $this->authorize('update', $prescription);
        
        // Update will be automatically logged by Auditable trait
        $prescription->update($request->validated());
        
        return response()->json($prescription);
    }
}
```

---

## 🔒 Environment Security (.env)

### Critical: Secure Your .env File

**Never commit `.env` to git!**

**File:** `backend/.env`

```env
# Application
APP_NAME="Optometric Clinic"
APP_ENV=production
APP_KEY=base64:GENERATE_NEW_KEY_WITH_php_artisan_key:generate
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database - KEEP THESE SECRET!
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_secure_database_name
DB_USERNAME=your_secure_username
DB_PASSWORD=your_super_strong_password_here

# Session Security
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

# Security Headers
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

### Database Password Best Practices:
- ✅ Minimum 16 characters
- ✅ Mix of uppercase, lowercase, numbers, symbols
- ✅ Never share or commit to git
- ✅ Rotate every 90 days

---

## 💾 Database Backup Strategy

### Automatic Daily Backups

**File:** `backend/app/Console/Commands/BackupDatabase.php`

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup';
    protected $description = 'Backup the database';

    public function handle()
    {
        $filename = 'backup-' . now()->format('Y-m-d-His') . '.sql';
        
        $command = sprintf(
            'mysqldump -u%s -p%s %s > %s',
            config('database.connections.mysql.username'),
            config('database.connections.mysql.password'),
            config('database.connections.mysql.database'),
            storage_path('backups/' . $filename)
        );
        
        exec($command);
        
        $this->info("Database backed up: {$filename}");
        
        // Delete backups older than 30 days
        $this->deleteOldBackups();
    }
    
    private function deleteOldBackups()
    {
        $files = glob(storage_path('backups/backup-*.sql'));
        $now = time();
        
        foreach ($files as $file) {
            if (is_file($file)) {
                if ($now - filemtime($file) >= 60 * 60 * 24 * 30) {
                    unlink($file);
                }
            }
        }
    }
}
```

**Schedule in:** `backend/app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule)
{
    // Daily backup at 2 AM
    $schedule->command('db:backup')->daily()->at('02:00');
}
```

---

## 🛡️ Additional Security Measures

### 1. Database Encryption (For Sensitive Fields)

**Create Encryption Service:**

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;

class EncryptionService
{
    public static function encrypt($value)
    {
        return Crypt::encryptString($value);
    }
    
    public static function decrypt($value)
    {
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }
}
```

**Use in Models:**

```php
// In Prescription model
public function setPrescriptionDataAttribute($value)
{
    $this->attributes['prescription_data'] = EncryptionService::encrypt(json_encode($value));
}

public function getPrescriptionDataAttribute($value)
{
    return json_decode(EncryptionService::decrypt($value), true);
}
```

### 2. IP Whitelisting for Admin Panel

**File:** `backend/app/Http/Middleware/IpWhitelist.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IpWhitelist
{
    protected $whitelist = [
        '127.0.0.1',
        '::1',
        // Add your office IPs here
    ];

    public function handle(Request $request, Closure $next)
    {
        if (!in_array($request->ip(), $this->whitelist)) {
            abort(403, 'Unauthorized IP address');
        }

        return $next($request);
    }
}
```

### 3. Two-Factor Authentication (2FA)

Install: `composer require pragmarx/google2fa-laravel`

**Enable for admin accounts:**

```php
// In User model
public function has2FA(): bool
{
    return !empty($this->google2fa_secret);
}
```

---

## 📊 Audit Log Monitoring

### View Audit Logs

**Create Controller:**

```php
class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);
        
        $logs = DB::table('audit_logs')
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->model_type, fn($q) => $q->where('model_type', $request->model_type))
            ->when($request->action, fn($q) => $q->where('action', $request->action))
            ->orderBy('created_at', 'desc')
            ->paginate(50);
            
        return response()->json($logs);
    }
}
```

### Monitor Suspicious Activity

Check logs regularly:

```bash
tail -f storage/logs/laravel.log | grep "SUSPICIOUS ACTIVITY"
```

---

## ✅ Security Checklist

### Before Production:

- [ ] All `.env` values are production-ready
- [ ] `APP_DEBUG=false` in production
- [ ] Strong database password set
- [ ] Migrations run (including audit_logs)
- [ ] Policies registered in AuthServiceProvider
- [ ] Middleware registered in Kernel
- [ ] All routes protected with appropriate middleware
- [ ] SSL certificate installed (HTTPS only)
- [ ] Database backups scheduled
- [ ] Firewall configured
- [ ] IP whitelisting for admin panel
- [ ] Regular security audits scheduled
- [ ] Logs monitored regularly
- [ ] Staff trained on security procedures

---

## 🚨 Emergency Procedures

### If Data Breach Suspected:

1. **Immediately change all passwords**
   ```bash
   php artisan tinker
   >>> User::where('role', 'admin')->each(fn($u) => $u->tokens()->delete());
   ```

2. **Check audit logs**
   ```sql
   SELECT * FROM audit_logs 
   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
   ORDER BY created_at DESC;
   ```

3. **Disable affected accounts**
   ```php
   User::whereIn('id', [suspicious_ids])->update(['is_approved' => false]);
   ```

4. **Restore from backup if needed**
   ```bash
   mysql -u username -p database_name < backup-file.sql
   ```

---

## 📞 Support

For security concerns:
- Review audit logs in `audit_logs` table
- Check Laravel logs in `storage/logs/`
- Monitor suspicious activity alerts

## Summary

Your data is now protected by:
1. ✅ **Authentication** - Only verified users can access
2. ✅ **Authorization** - Users can only access what they're allowed to
3. ✅ **Audit Trails** - Every change is logged
4. ✅ **Soft Deletes** - Data never truly deleted
5. ✅ **Rate Limiting** - Prevents abuse
6. ✅ **Encryption Ready** - Sensitive data can be encrypted
7. ✅ **Backups** - Regular automated backups
8. ✅ **Monitoring** - Suspicious activity tracked

**Your real data is now SECURE! 🔐**


