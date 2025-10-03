# Prescription Authentication Debug Guide

## Problem
Getting 401 Unauthorized error when trying to create prescriptions:
```
localhost:8000/api/prescriptions:1 Failed to load resource: the server responded with a status of 401 (Unauthorized)
PrescriptionForm.tsx:93 Prescription creation error: Error: Failed to create prescription
```

## Debug Steps

### 1. Check Authentication Status

**Frontend Test:**
1. Open browser console
2. Run the authentication debug test: `frontend--/src/test_auth_debug.html`
3. Check the results for token and user data

**Backend Test:**
1. Test the debug endpoint: `GET http://localhost:8000/api/debug-auth`
2. Use the same token from your browser session
3. Check if it returns user information

### 2. Common Causes & Solutions

#### A. Token Issues
**Symptoms:** No token or invalid token
**Solutions:**
- Log out and log back in
- Check if token is stored in sessionStorage
- Verify token format (should start with number, not "Bearer")

#### B. User Role Issues
**Symptoms:** Token valid but user role not authorized
**Solutions:**
- Verify user has 'optometrist' role in database
- Check if user is properly authenticated
- Ensure user account is active

#### C. Backend Authentication Issues
**Symptoms:** Token valid but backend rejects it
**Solutions:**
- Check Laravel logs for authentication errors
- Verify Sanctum middleware is working
- Check if user session is valid

### 3. Enhanced Error Handling

**Frontend Changes Made:**
- Added token validation before API call
- Added user data validation
- Enhanced error logging with detailed information
- Better error messages for debugging

**Backend Changes Made:**
- Added debug authentication endpoint
- Enhanced error logging in PrescriptionController

### 4. Testing Commands

**Test Authentication:**
```bash
# Test if user is authenticated
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/debug-auth

# Test prescription creation
curl -X POST http://localhost:8000/api/prescriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"appointment_id": 1, "right_eye": {"sphere": "-2.00"}, "left_eye": {"sphere": "-1.75"}}'
```

**Check Database:**
```sql
-- Check user role
SELECT id, name, email, role FROM users WHERE id = YOUR_USER_ID;

-- Check if user has valid tokens
SELECT * FROM personal_access_tokens WHERE tokenable_id = YOUR_USER_ID;
```

### 5. Quick Fixes

#### If Token is Missing:
1. Log out completely
2. Clear browser storage
3. Log back in
4. Try prescription creation again

#### If User Role is Wrong:
1. Check database user role
2. Update role if needed: `UPDATE users SET role = 'optometrist' WHERE id = YOUR_USER_ID;`
3. Log out and log back in

#### If Backend Issues:
1. Restart Laravel server
2. Clear Laravel cache: `php artisan cache:clear`
3. Check Laravel logs: `tail -f storage/logs/laravel.log`

### 6. Debug Endpoints Added

**GET /api/debug-auth**
- Returns detailed authentication information
- Helps identify if token and user are valid
- Shows user role and permissions

**Enhanced PrescriptionForm.tsx**
- Better error handling and logging
- Token and user validation
- Detailed console output for debugging

### 7. Expected Behavior After Fix

✅ **Authentication Working:**
- Token is present and valid
- User is properly authenticated
- User has correct role (optometrist)
- Backend accepts the request

✅ **Prescription Creation Working:**
- No 401 Unauthorized errors
- Prescription is created successfully
- Appointment status updates to completed
- Success message is displayed

### 8. Files Modified

1. `frontend--/src/components/prescriptions/PrescriptionForm.tsx` - Enhanced error handling
2. `backend/routes/api.php` - Added debug endpoint
3. `frontend--/src/test_auth_debug.html` - Debug test page
4. `backend/test_prescription_auth.php` - Debug script

## Next Steps

1. **Run the debug test** to identify the specific issue
2. **Check the console output** for detailed error information
3. **Apply the appropriate fix** based on the debug results
4. **Test prescription creation** again to verify the fix

The enhanced error handling should now provide much more detailed information about what's causing the 401 Unauthorized error.
