# 🚀 Quick Security Implementation Steps

## Step-by-Step Guide to Protect Your Data

### ✅ Step 1: Run Database Migrations

This will create the audit logs table and add soft deletes to protect your data:

```bash
cd backend
php artisan migrate
```

**What this does:**
- Creates `audit_logs` table to track all data changes
- Adds `deleted_at` columns to critical tables (Users, Prescriptions, Transactions, Receipts)
- Data will never be permanently deleted, only marked as deleted

---

### ✅ Step 2: Test Middleware Registration

The middleware has been registered in `bootstrap/app.php`. Test it:

```bash
php artisan route:list
```

You should see routes with `role` and `rate.api` middleware available.

---

### ✅ Step 3: Set Up Automated Backups

Schedule daily backups by adding this to `routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('db:backup')->daily()->at('02:00');
```

To test the backup command:

```bash
php artisan db:backup
```

Check `backend/storage/backups/` for the backup file.

---

### ✅ Step 4: Secure Your .env File

**CRITICAL:** Update your `.env` file with secure values:

```env
# Never use these in production!
APP_DEBUG=false
APP_ENV=production

# Generate new key
APP_KEY=base64:...  # Run: php artisan key:generate

# Use strong database credentials
DB_PASSWORD=your_very_strong_password_here_minimum_16_characters

# Enable secure sessions
SESSION_SECURE_COOKIE=true
SESSION_ENCRYPT=true
```

**Generate a new application key:**
```bash
php artisan key:generate
```

---

### ✅ Step 5: Protect Your Routes

Update your `routes/api.php` to use the new middleware:

**Example:**

```php
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AuthController;

// Public routes (with rate limiting)
Route::middleware(['rate.api:10,1'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// All authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    
    // ADMIN ONLY - Full system access
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/users', [AuthController::class, 'getAllUsers']);
        Route::post('/users/{id}/approve', [AuthController::class, 'approveUser']);
        Route::delete('/users/{id}', [AuthController::class, 'deleteUser']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });
    
    // OPTOMETRIST ONLY - Prescription management
    Route::middleware(['role:optometrist'])->group(function () {
        Route::post('/prescriptions', [PrescriptionController::class, 'store']);
        Route::put('/prescriptions/{id}', [PrescriptionController::class, 'update']);
    });
    
    // STAFF ONLY - Transaction and product management
    Route::middleware(['role:staff'])->group(function () {
        Route::post('/transactions', [TransactionController::class, 'store']);
        Route::get('/products/staff', [ProductController::class, 'staffIndex']);
    });
    
    // CUSTOMER ONLY - View own data
    Route::middleware(['role:customer'])->group(function () {
        Route::get('/prescriptions/my', [PrescriptionController::class, 'myPrescriptions']);
        Route::get('/transactions/my', [TransactionController::class, 'myTransactions']);
    });
    
    // MULTIPLE ROLES - Shared access
    Route::middleware(['role:admin,staff'])->group(function () {
        Route::get('/analytics', [AnalyticsController::class, 'index']);
        Route::get('/reports', [ReportsController::class, 'index']);
    });
});
```

---

### ✅ Step 6: Update Controllers to Use Policies

**Example: PrescriptionController**

```php
<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Services\AuditLogService;

class PrescriptionController extends Controller
{
    // View single prescription (with authorization)
    public function show($id)
    {
        $prescription = Prescription::findOrFail($id);
        
        // Check if user is authorized to view this prescription
        if (!Gate::allows('view', $prescription)) {
            // Log suspicious activity
            AuditLogService::logSuspiciousActivity(
                'Unauthorized prescription access attempt',
                ['prescription_id' => $id]
            );
            
            return response()->json([
                'message' => 'Unauthorized. You cannot view this prescription.'
            ], 403);
        }
        
        // Log legitimate access
        AuditLogService::logAccess('Prescription', $id, 'view');
        
        return response()->json($prescription);
    }
    
    // Update prescription (with authorization)
    public function update(Request $request, $id)
    {
        $prescription = Prescription::findOrFail($id);
        
        // Authorize using policy (throws 403 if unauthorized)
        $this->authorize('update', $prescription);
        
        $validated = $request->validate([
            'prescription_data' => 'sometimes|array',
            'notes' => 'sometimes|string|max:1000',
            'status' => 'sometimes|in:active,inactive,expired',
        ]);
        
        // Update will be automatically logged by Auditable trait
        $prescription->update($validated);
        
        return response()->json([
            'message' => 'Prescription updated successfully',
            'prescription' => $prescription
        ]);
    }
    
    // Delete prescription (with authorization)
    public function destroy($id)
    {
        $prescription = Prescription::findOrFail($id);
        
        $this->authorize('delete', $prescription);
        
        // Soft delete (data not actually deleted, just marked)
        $prescription->delete();
        
        return response()->json([
            'message' => 'Prescription deleted successfully'
        ]);
    }
    
    // Customer views their own prescriptions
    public function myPrescriptions(Request $request)
    {
        $user = $request->user();
        
        $prescriptions = Prescription::where('patient_id', $user->id)
            ->with(['optometrist', 'appointment'])
            ->get();
        
        // Access logging (batch)
        foreach ($prescriptions as $prescription) {
            AuditLogService::logAccess('Prescription', $prescription->id, 'view');
        }
        
        return response()->json($prescriptions);
    }
}
```

---

### ✅ Step 7: Test the Security

**Test 1: Try accessing data without permission**

```bash
# Login as customer
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"password","role":"customer"}'

# Try to access admin endpoint (should fail with 403)
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test 2: Check audit logs**

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```

**Test 3: Test soft deletes**

```bash
# Delete a prescription
# Then check the database - it should still be there with deleted_at timestamp
SELECT * FROM prescriptions WHERE id = X;
```

---

### ✅ Step 8: Monitor Security

**Daily Tasks:**

1. Check audit logs for suspicious activity:
```bash
tail -f storage/logs/laravel.log | grep "SUSPICIOUS ACTIVITY"
```

2. Review recent deletions:
```sql
SELECT * FROM prescriptions WHERE deleted_at IS NOT NULL;
SELECT * FROM transactions WHERE deleted_at IS NOT NULL;
```

3. Check failed login attempts:
```sql
SELECT * FROM audit_logs WHERE action = 'login_failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

### ✅ Step 9: Enable Cron for Scheduled Tasks

For automated backups to work, enable Laravel's scheduler:

**Linux/Mac:**
```bash
crontab -e
# Add this line:
* * * * * cd /path-to-your-project/backend && php artisan schedule:run >> /dev/null 2>&1
```

**Windows:**
Use Task Scheduler to run:
```
php C:\path\to\backend\artisan schedule:run
```
Every minute.

---

### ✅ Step 10: Create Admin Account (If Needed)

```bash
php artisan tinker
```

```php
use App\Models\User;
use App\Enums\UserRole;

User::create([
    'name' => 'System Admin',
    'email' => 'admin@clinic.com',
    'password' => bcrypt('your_secure_password'),
    'role' => UserRole::ADMIN,
    'is_approved' => true,
]);
```

---

## 🎉 You're Done!

Your data is now protected by:

✅ **Authentication** - Laravel Sanctum tokens  
✅ **Authorization** - Role-based policies  
✅ **Audit Logging** - Every change tracked  
✅ **Soft Deletes** - Data never lost  
✅ **Rate Limiting** - Brute force protection  
✅ **Automated Backups** - Daily database backups  

---

## 📋 Quick Reference

### Check if everything is working:

```bash
# 1. Middleware registered?
php artisan route:list | grep role

# 2. Migrations run?
php artisan migrate:status

# 3. Can backup?
php artisan db:backup

# 4. Policies loaded?
php artisan tinker
>>> Gate::getPolicyFor(App\Models\Prescription::class)
```

### View audit logs:

```sql
-- Recent activity
SELECT u.name, a.model_type, a.action, a.created_at 
FROM audit_logs a 
LEFT JOIN users u ON a.user_id = u.id 
ORDER BY a.created_at DESC 
LIMIT 50;

-- Suspicious activity
SELECT * FROM audit_logs WHERE action = 'suspicious_activity';
```

---

## 🆘 Troubleshooting

**Problem:** Migrations fail  
**Solution:** Check database connection in `.env`

**Problem:** Middleware not working  
**Solution:** Clear cache with `php artisan optimize:clear`

**Problem:** Can't access after adding middleware  
**Solution:** Check user role in database matches route requirement

**Problem:** Audit logs not recording  
**Solution:** Ensure migration ran and models use `Auditable` trait

---

## 📚 Additional Resources

- Full security guide: `backend/DATA_SECURITY_GUIDE.md`
- Laravel Security Docs: https://laravel.com/docs/authorization
- Sanctum Docs: https://laravel.com/docs/sanctum

**Your real data is now SECURE and PROTECTED! 🔐**


