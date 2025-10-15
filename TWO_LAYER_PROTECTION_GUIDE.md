i don tsee # 🛡️ Two-Layer Protection System for Protected Accounts

## Overview

The system now implements a **two-step confirmation process** for modifying or deleting protected accounts. This prevents accidental changes while still allowing admins full control.

---

## 🔐 How It Works

### Layer 1: Account Protection Flag
- Protected accounts are marked with `is_protected = true`
- Genesis Abanales is automatically protected
- Any modification/deletion triggers Layer 2

### Layer 2: Confirmation Token System
- Requires explicit confirmation from admin
- Time-limited tokens (5 minutes)
- Single-use only (prevents replay attacks)
- Shows affected data before confirmation
- All attempts logged in audit trail

---

## 🎯 For Administrators

### Scenario 1: Attempting to Modify a Protected Account

**First Request** (without confirmation):

```http
PUT /api/admin/users/45
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

**Response** (Status 202 - Confirmation Required):

```json
{
  "message": "This is a protected account. Confirmation required.",
  "protected_user": "ganesis@gmail.com",
  "warning": "⚠️ You are about to modify a PROTECTED account",
  "confirmation_required": true,
  "confirmation_token": "CgsAhGsYq0aZZICChkPX6Gib44uk6oCyNUmuyaiHjE8TUJ1zlQE0LIUtAptV4Yoc",
  "expires_in_minutes": 5,
  "instructions": "To proceed, send the same request again with this confirmation_token in the request body within 5 minutes."
}
```

**Second Request** (with confirmation token):

```http
PUT /api/admin/users/45
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "confirmation_token": "CgsAhGsYq0aZZICChkPX6Gib44uk6oCyNUmuyaiHjE8TUJ1zlQE0LIUtAptV4Yoc"
}
```

**Response** (Status 200 - Success):

```json
{
  "message": "User updated successfully",
  "user": {
    "id": 45,
    "name": "Updated Name",
    "email": "newemail@example.com",
    "role": "customer"
  }
}
```

---

### Scenario 2: Attempting to Delete a Protected Account

**First Request** (without confirmation):

```http
DELETE /api/admin/users/45
Authorization: Bearer {admin_token}
```

**Response** (Status 202 - Confirmation Required):

```json
{
  "message": "This is a protected account. Confirmation required.",
  "protected_user": {
    "name": "Genesis Abanales",
    "email": "ganesis@gmail.com",
    "id": 45
  },
  "warning": "🚨 DANGER: You are about to DELETE a PROTECTED account!",
  "data_affected": {
    "transactions": 2,
    "reservations": 2
  },
  "confirmation_required": true,
  "confirmation_token": "ABC123XYZ789...",
  "expires_in_minutes": 5,
  "instructions": "To proceed with deletion, send DELETE request again with this confirmation_token in the request body within 5 minutes."
}
```

**Second Request** (with confirmation):

```http
DELETE /api/admin/users/45
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "confirmation_token": "ABC123XYZ789..."
}
```

**Response** (Status 200 - Deleted):

```json
{
  "message": "User deleted successfully"
}
```

---

## 🔒 Security Features

### 1. Time-Limited Tokens
- Tokens expire after **5 minutes**
- Forces deliberate action, not accidental clicks
- Expired tokens are automatically cleaned up

### 2. Single-Use Tokens
- Each token can only be used once
- Prevents replay attacks
- Must request new token for each action

### 3. Action-Specific Tokens
- Token is tied to specific action (update/delete)
- Token is tied to specific user (target)
- Token is tied to admin who requested it
- Cannot be reused for different purposes

### 4. Complete Audit Trail
All actions are logged:
- `modification_requested` - Admin requested to modify
- `deletion_requested` - Admin requested to delete
- `protected_modification_confirmed` - Admin confirmed modification
- `protected_deletion_confirmed` - Admin confirmed deletion

### 5. Data Impact Preview
Before confirming deletion, admin sees:
- Account name and email
- Number of transactions
- Number of reservations
- Any other affected data

---

## 💡 Benefits

### For System Security
✅ **Prevents accidental deletions** - Two-step process stops fat-finger mistakes  
✅ **Audit trail** - Every attempt logged  
✅ **Time window** - 5-minute expiry prevents stale tokens  
✅ **Replay protection** - Single-use tokens  

### For Administrators
✅ **Full control** - Admin can still manage all accounts  
✅ **Clear warnings** - Knows when dealing with protected accounts  
✅ **Data visibility** - Sees impact before confirming  
✅ **Flexibility** - Can cancel by not confirming  

### For Protected Accounts (Genesis)
✅ **Extra safety** - Two layers of protection  
✅ **Transparency** - All access attempts logged  
✅ **Reversible** - Admin can still manage if needed  
✅ **Data preserved** - Soft deletes prevent permanent loss  

---

## 📊 Protection Comparison

| Operation | Regular Account | Protected Account (Layer 1) | Protected Account (Layer 2) |
|-----------|----------------|------------------------------|------------------------------|
| View | ✅ Immediate | ✅ Immediate | ✅ Immediate |
| Update | ✅ Immediate | ⚠️ Requires confirmation | ⚠️ Requires token + confirmation |
| Delete | ✅ Immediate | ⚠️ Requires confirmation | ⚠️ Requires token + confirmation |
| Audit Log | ✅ Basic | ✅ Detailed | ✅ Complete with attempts |
| Recovery | ✅ Soft delete | ✅ Soft delete | ✅ Soft delete + audit trail |

---

## 🚀 Usage Examples

### Example 1: Admin Changes Mind

```bash
# Step 1: Admin tries to delete
DELETE /api/admin/users/45
# Response: Returns confirmation_token

# Step 2: Admin reviews data impact
# Sees: 2 transactions, 2 reservations

# Step 3: Admin decides NOT to proceed
# → Does nothing, token expires in 5 minutes
# → Genesis account safe
# → Attempt logged for security
```

### Example 2: Admin Proceeds with Deletion

```bash
# Step 1: Admin tries to delete
DELETE /api/admin/users/45
# Response: Returns confirmation_token

# Step 2: Admin reviews and confirms
DELETE /api/admin/users/45
Body: { "confirmation_token": "..." }
# Response: User deleted successfully

# Result:
# ✓ Genesis account deleted (soft delete)
# ✓ Data preserved in database
# ✓ Can be restored if needed
# ✓ All actions logged
```

### Example 3: Expired Token

```bash
# Step 1: Admin requests deletion
DELETE /api/admin/users/45
# Response: Returns confirmation_token

# Step 2: Admin waits > 5 minutes

# Step 3: Admin tries to confirm
DELETE /api/admin/users/45
Body: { "confirmation_token": "expired_token" }
# Response: 400 Bad Request - Token expired

# Result:
# ✗ Deletion blocked
# ℹ️ Must request new token
```

---

## 🔧 Configuration

### Enable/Disable Protection

In `.env`:
```env
ENABLE_PROTECTED_ACCOUNTS=true  # Enable two-layer protection
```

### Token Expiration

In `ConfirmationToken::generate()`:
```php
$token = ConfirmationToken::generate(
    'delete_protected_user',
    $userId,
    $targetId,
    User::class,
    $data,
    5  // Change this number (minutes)
);
```

### Mark Account as Protected

```php
$user = User::find($id);
$user->is_protected = true;
$user->save();
```

Or via script:
```bash
php backend/protect_account.php email@example.com
```

---

## 📝 Database Schema

### confirmation_tokens Table

```sql
CREATE TABLE confirmation_tokens (
    id BIGINT PRIMARY KEY,
    token VARCHAR(64) UNIQUE,
    action VARCHAR(255),        -- Action type
    user_id BIGINT,            -- Who is performing action
    target_id BIGINT,          -- What is being acted upon
    target_type VARCHAR(255),  -- Model type
    action_data JSON,          -- Additional data
    expires_at TIMESTAMP,      -- Expiration time
    used BOOLEAN DEFAULT 0,    -- Single-use flag
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🔍 Monitoring & Alerts

### Check Recent Protection Attempts

```php
use App\Models\AuditLog;

// Get all deletion requests
$requests = AuditLog::where('event', 'deletion_requested')
    ->whereDate('created_at', today())
    ->get();

// Get confirmed deletions
$confirmed = AuditLog::where('event', 'protected_deletion_confirmed')
    ->whereDate('created_at', today())
    ->get();
```

### Alert on Protected Account Access

```php
// Monitor for multiple attempts
$attempts = AuditLog::where('auditable_id', $protectedUserId)
    ->whereIn('event', ['deletion_requested', 'modification_requested'])
    ->where('created_at', '>', now()->subHour())
    ->count();

if ($attempts > 3) {
    // Send alert: Multiple attempts to modify protected account
}
```

---

## ✅ Testing Checklist

- [ ] Protected account cannot be modified without token
- [ ] Protected account cannot be deleted without token
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] Used tokens cannot be reused
- [ ] Admin can see affected data count
- [ ] All attempts are logged
- [ ] Regular accounts work normally (no token required)

---

## 🆘 Troubleshooting

### Token Not Working

**Problem**: "Invalid or expired confirmation token"

**Solutions**:
1. Check token hasn't expired (5 min limit)
2. Ensure token hasn't been used already
3. Verify token matches the action (update vs delete)
4. Confirm token is for correct target user

### Can't Modify Protected Account

**Problem**: Getting 403 Forbidden

**Solutions**:
1. You need admin role
2. Must provide confirmation_token on second request
3. Check `ENABLE_PROTECTED_ACCOUNTS` is true in .env

### How to Remove Protection

```php
$user = User::find($id);
$user->is_protected = false;
$user->save();
```

**Note**: Only do this if absolutely necessary!

---

## 📞 Support

For issues with two-layer protection:

1. Check audit logs: `php backend/test_two_layer_protection.php`
2. Verify protection status: `php backend/check_all_users.php`
3. View recent tokens: Check `confirmation_tokens` table

---

**System Status:** ✅ **FULLY OPERATIONAL**  
**Genesis Account:** 🛡️ **PROTECTED WITH TWO LAYERS**  
**Admin Control:** ✅ **MAINTAINED WITH SAFEGUARDS**

