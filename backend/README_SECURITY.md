# 🔐 Laravel Application Security System

## Overview

This Laravel application now has **comprehensive multi-layer security** to protect your real data. Your data is:

✅ **Protected** - Multiple authorization layers  
✅ **Tracked** - All changes audited  
✅ **Recoverable** - Automated backups  
✅ **Secure** - Never truly deleted (soft deletes)  
✅ **Monitored** - Suspicious activity logged  

---

## 🚀 Quick Start (3 Steps)

### 1. Run Migrations
```bash
cd backend
php artisan migrate
```

### 2. Test Security
```bash
# Test backup system
php artisan db:backup

# Check routes are protected
php artisan route:list | grep auth:sanctum
```

### 3. Update Your Routes
See: `SECURITY_IMPLEMENTATION_STEPS.md` for route examples

---

## 📁 Security Files Added

### Core Security Components:

**Middleware:**
- `app/Http/Middleware/CheckRole.php` - Role-based access control
- `app/Http/Middleware/RateLimitApi.php` - Rate limiting for brute force protection

**Policies:**
- `app/Policies/PrescriptionPolicy.php` - Prescription data protection
- `app/Policies/TransactionPolicy.php` - Financial data protection
- `app/Policies/UserPolicy.php` - User data protection

**Services:**
- `app/Services/AuditLogService.php` - Track all data changes

**Traits:**
- `app/Traits/Auditable.php` - Auto-log all model changes

**Commands:**
- `app/Console/Commands/BackupDatabase.php` - Automated backups

**Migrations:**
- `database/migrations/2024_10_11_000001_create_audit_logs_table.php`
- `database/migrations/2024_10_11_000002_add_soft_deletes_to_critical_tables.php`

---

## 🔒 Security Features

### 1. Authentication (Who are you?)
- Laravel Sanctum API tokens
- Bcrypt password hashing
- Token expiration
- Rate limiting on login

### 2. Authorization (What can you do?)
- Role-based middleware (`admin`, `staff`, `optometrist`, `customer`)
- Policy-based permissions
- Branch-level data isolation
- Automatic unauthorized access logging

### 3. Audit Logging (What happened?)
- Every data change tracked in `audit_logs` table
- Includes: who, what, when, where (IP), before/after values
- Suspicious activity flagged
- Immutable audit trail

### 4. Data Protection (Keep it safe)
- Soft deletes (data never truly deleted)
- Mass assignment protection
- Hidden sensitive fields
- Encryption-ready

### 5. Backup & Recovery (Don't lose it)
- Automated daily backups
- 30-day retention
- Easy restore process
- Tested backup command

---

## 🎯 How To Use

### Protect a Route

```php
// In routes/api.php

// Admin only
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});

// Multiple roles
Route::middleware(['auth:sanctum', 'role:admin,staff'])->group(function () {
    Route::get('/analytics', [AnalyticsController::class, 'index']);
});

// Rate limited
Route::middleware(['rate.api:10,1'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});
```

### Use Policy in Controller

```php
use Illuminate\Support\Facades\Gate;
use App\Services\AuditLogService;

class PrescriptionController extends Controller
{
    public function show($id)
    {
        $prescription = Prescription::findOrFail($id);
        
        // Check authorization
        if (!Gate::allows('view', $prescription)) {
            AuditLogService::logSuspiciousActivity(
                'Unauthorized prescription access',
                ['prescription_id' => $id]
            );
            abort(403);
        }
        
        // Log access
        AuditLogService::logAccess('Prescription', $id, 'view');
        
        return response()->json($prescription);
    }
    
    public function update(Request $request, $id)
    {
        $prescription = Prescription::findOrFail($id);
        
        // This will automatically return 403 if unauthorized
        $this->authorize('update', $prescription);
        
        $prescription->update($request->validated());
        
        return response()->json($prescription);
    }
}
```

### Add Auditing to a Model

```php
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;

class YourModel extends Model
{
    use SoftDeletes, Auditable;
    
    protected $fillable = ['field1', 'field2'];
    
    // Changes are now automatically logged!
}
```

---

## 📊 Monitor Your Security

### View Recent Activity

```sql
-- Recent changes
SELECT u.name, a.model_type, a.action, a.created_at 
FROM audit_logs a 
LEFT JOIN users u ON a.user_id = u.id 
ORDER BY a.created_at DESC 
LIMIT 50;
```

### View Suspicious Activity

```sql
SELECT * FROM audit_logs 
WHERE action = 'suspicious_activity' 
ORDER BY created_at DESC;
```

### Check Soft Deleted Records

```sql
-- See what was "deleted" but is still recoverable
SELECT * FROM prescriptions WHERE deleted_at IS NOT NULL;
SELECT * FROM transactions WHERE deleted_at IS NOT NULL;
```

### Check Failed Logins

```bash
# In Laravel logs
tail -f storage/logs/laravel.log | grep "Login failed"
```

---

## 🔧 Configuration

### Registered in `bootstrap/app.php`:

```php
'role' => \App\Http\Middleware\CheckRole::class,
'rate.api' => \App\Http\Middleware\RateLimitApi::class,
```

### Registered in `app/Providers/AppServiceProvider.php`:

```php
Gate::policy(Prescription::class, PrescriptionPolicy::class);
Gate::policy(Transaction::class, TransactionPolicy::class);
Gate::policy(User::class, UserPolicy::class);
```

### Scheduled in `routes/console.php`:

```php
Schedule::command('db:backup')->daily()->at('02:00');
```

---

## 🧪 Testing Security

```bash
# Test role middleware
php artisan test --filter RoleMiddlewareTest

# Test policies
php artisan test --filter PolicyTest

# Test backup
php artisan db:backup

# Test audit logging
php artisan tinker
>>> $user = User::first();
>>> $user->update(['name' => 'Test']);
>>> DB::table('audit_logs')->latest()->first();
```

---

## 📚 Documentation

- **Quick Guide:** `SECURITY_IMPLEMENTATION_STEPS.md`
- **Full Guide:** `DATA_SECURITY_GUIDE.md`
- **Checklist:** `SECURITY_CHECKLIST.md`
- **This File:** `README_SECURITY.md`

---

## ⚙️ Models Protected

These models now have soft deletes and audit logging:

- ✅ `User` - All user accounts
- ✅ `Prescription` - Patient prescriptions
- ✅ `Transaction` - Financial transactions
- ✅ `Receipt` - Sales receipts

---

## 🎭 Roles & Permissions

### Admin
- Full system access
- Can view/modify all data
- Can approve users
- Can view audit logs
- Can void transactions

### Optometrist
- Create/update prescriptions they created
- View appointments
- View patients in their branch

### Staff
- Create transactions
- Manage products in their branch
- View appointments in their branch
- Cannot modify prescriptions

### Customer
- View own prescriptions
- View own transactions
- Create own appointments
- Cannot access others' data

---

## 🚨 Emergency Procedures

### Suspected Data Breach:

```bash
# 1. Revoke all tokens
php artisan tinker
>>> User::all()->each(fn($u) => $u->tokens()->delete());

# 2. Check audit logs
SELECT * FROM audit_logs WHERE created_at >= NOW() - INTERVAL 24 HOUR;

# 3. Enable maintenance mode
php artisan down

# 4. Restore from backup if needed
mysql -u user -p database < storage/backups/backup-YYYY-MM-DD.sql
```

---

## ✅ Security Checklist

Before production:

- [ ] Run `php artisan migrate`
- [ ] Update `.env` with secure values (`APP_DEBUG=false`)
- [ ] Enable HTTPS
- [ ] Set strong database password
- [ ] Enable automated backups
- [ ] Test all security features
- [ ] Train staff on security

See `SECURITY_CHECKLIST.md` for complete list.

---

## 🔐 Key Security Principles

1. **Defense in Depth** - Multiple security layers
2. **Least Privilege** - Users can only access what they need
3. **Audit Everything** - All changes are logged
4. **Never Delete** - Soft deletes preserve data
5. **Fail Secure** - Deny access by default
6. **Monitor Continuously** - Watch for suspicious activity

---

## 💡 Best Practices

### DO:
✅ Always use `auth:sanctum` middleware on protected routes  
✅ Check authorization in controllers with policies  
✅ Log suspicious activity  
✅ Use soft deletes on critical data  
✅ Review audit logs regularly  
✅ Keep dependencies updated  

### DON'T:
❌ Never commit `.env` to git  
❌ Never set `APP_DEBUG=true` in production  
❌ Never bypass authorization checks  
❌ Never hard delete critical data  
❌ Never expose sensitive data in error messages  
❌ Never trust user input without validation  

---

## 🎯 Next Steps

1. **Read:** `SECURITY_IMPLEMENTATION_STEPS.md`
2. **Implement:** Update your routes and controllers
3. **Test:** Run security tests
4. **Deploy:** Follow production checklist
5. **Monitor:** Review audit logs regularly

---

## 📞 Support

Need help?
- Check audit logs: `SELECT * FROM audit_logs ORDER BY created_at DESC`
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Review documentation in this directory

---

**Your data is now PROTECTED, TRACKED, and SECURE! 🔐**

Last Updated: October 11, 2024


