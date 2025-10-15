# 🔒 Security Checklist for Production Deployment

Use this checklist before deploying to production to ensure your data is fully protected.

## ✅ Pre-Deployment Security Checklist

### 1. Environment Configuration
- [ ] `.env` file exists and contains production values
- [ ] `APP_DEBUG=false` (NEVER true in production)
- [ ] `APP_ENV=production`
- [ ] `APP_KEY` generated (`php artisan key:generate`)
- [ ] Strong database password set (minimum 16 characters)
- [ ] `SESSION_SECURE_COOKIE=true` (requires HTTPS)
- [ ] `SESSION_ENCRYPT=true`
- [ ] `.env` is in `.gitignore` (NEVER commit to git)

### 2. Database Security
- [ ] Database migrations run (`php artisan migrate`)
- [ ] Audit logs table created and working
- [ ] Soft deletes enabled on critical tables
- [ ] Database user has minimum required privileges
- [ ] Database accessible only from application server IP
- [ ] Database password changed from default
- [ ] Foreign key constraints enabled

### 3. Authentication & Authorization
- [ ] Laravel Sanctum installed and configured
- [ ] All API routes protected with `auth:sanctum` middleware
- [ ] Role-based middleware (`role:admin`) applied to sensitive routes
- [ ] Policies registered in `AppServiceProvider`
- [ ] Password hashing verified (bcrypt)
- [ ] Token expiration configured
- [ ] Rate limiting enabled on login endpoints

### 4. Access Control
- [ ] Admin routes restricted to `role:admin` middleware
- [ ] Optometrist routes restricted appropriately
- [ ] Staff routes restricted appropriately
- [ ] Customer routes restricted to own data
- [ ] Branch isolation enforced
- [ ] IP whitelisting for admin panel (optional but recommended)

### 5. Data Protection
- [ ] All critical models use `Auditable` trait
- [ ] All critical models use `SoftDeletes` trait
- [ ] `$fillable` arrays defined on all models
- [ ] `$hidden` arrays include sensitive fields (password, tokens)
- [ ] Sensitive data encrypted where necessary
- [ ] File upload validation and sanitization

### 6. Backup & Recovery
- [ ] Automated backup command tested (`php artisan db:backup`)
- [ ] Backup schedule configured in `routes/console.php`
- [ ] Cron job or Task Scheduler enabled for `schedule:run`
- [ ] Backup storage location secure and accessible
- [ ] Backup restoration tested successfully
- [ ] Backup retention policy implemented (30 days)

### 7. Monitoring & Logging
- [ ] Laravel logging configured (`LOG_CHANNEL=daily`)
- [ ] Audit logs recording all critical operations
- [ ] Suspicious activity logging enabled
- [ ] Log files protected and not publicly accessible
- [ ] Log rotation configured to prevent disk space issues

### 8. Server Security
- [ ] HTTPS/SSL certificate installed and valid
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] SSH key authentication enabled (password auth disabled)
- [ ] Server software updated (PHP, MySQL, etc.)
- [ ] File permissions correct (storage, bootstrap/cache writable)
- [ ] Public directory is web root (not project root)
- [ ] Directory listing disabled

### 9. Code Security
- [ ] No sensitive data in code
- [ ] No debug statements or `dd()` calls
- [ ] All user inputs validated and sanitized
- [ ] SQL injection prevention (use Eloquent/Query Builder)
- [ ] XSS prevention (use Blade escaping)
- [ ] CSRF protection enabled for forms
- [ ] Dependencies updated (`composer update`)
- [ ] Security vulnerabilities checked (`composer audit`)

### 10. API Security
- [ ] CORS properly configured
- [ ] API versioning implemented if needed
- [ ] Rate limiting on all endpoints
- [ ] Request validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] API tokens expire and refresh properly

### 11. User Management
- [ ] Strong password policy enforced
- [ ] Account approval workflow active (`is_approved` field)
- [ ] Failed login attempts logged
- [ ] Account lockout after failed attempts (optional)
- [ ] Password reset functionality secure
- [ ] User roles cannot be self-modified

### 12. Compliance & Documentation
- [ ] Privacy policy in place
- [ ] Terms of service in place
- [ ] User data handling documented
- [ ] Audit trail accessible for compliance
- [ ] Security documentation reviewed
- [ ] Staff trained on security procedures

## 🔍 Security Testing

### Test 1: Authentication
```bash
# Try accessing protected route without token (should fail)
curl http://yourdomain.com/api/users

# Login and get token
curl -X POST http://yourdomain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","role":"customer"}'

# Use token (should succeed for authorized endpoints)
curl http://yourdomain.com/api/prescriptions/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Authorization
```bash
# Login as customer
# Try to access admin endpoint (should return 403)
curl http://yourdomain.com/api/users \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

### Test 3: Audit Logging
```sql
-- Check that operations are being logged
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```

### Test 4: Soft Deletes
```bash
# Delete a record via API
curl -X DELETE http://yourdomain.com/api/prescriptions/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check database - should have deleted_at timestamp, not actually deleted
SELECT * FROM prescriptions WHERE id = 1;
```

### Test 5: Rate Limiting
```bash
# Try login 10 times rapidly (should get rate limited)
for i in {1..10}; do
  curl -X POST http://yourdomain.com/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong","role":"customer"}'
done
```

### Test 6: Backup & Restore
```bash
# Create backup
php artisan db:backup

# Test restore (on test database!)
mysql -u username -p test_database < storage/backups/backup-YYYY-MM-DD-HHMMSS.sql
```

## 🚨 Security Incident Response

### If breach suspected:

1. **Immediately:**
   - Change all database passwords
   - Revoke all API tokens
   - Enable maintenance mode: `php artisan down`

2. **Investigate:**
   - Check audit logs for unauthorized access
   - Review server logs
   - Identify affected data

3. **Recover:**
   - Restore from backup if necessary
   - Patch vulnerability
   - Reset affected user passwords

4. **Document:**
   - Record incident details
   - Note lessons learned
   - Update security procedures

## 📞 Emergency Contacts

- System Administrator: _________________
- Database Administrator: _________________
- Security Officer: _________________
- Hosting Provider Support: _________________

## 📅 Regular Maintenance Schedule

### Daily:
- [ ] Review audit logs for suspicious activity
- [ ] Verify backup ran successfully
- [ ] Check disk space

### Weekly:
- [ ] Review failed login attempts
- [ ] Check for soft-deleted records
- [ ] Review error logs

### Monthly:
- [ ] Update dependencies (`composer update`)
- [ ] Security audit (`composer audit`)
- [ ] Review user accounts and permissions
- [ ] Test backup restoration
- [ ] Rotate database passwords

### Quarterly:
- [ ] Full security review
- [ ] Penetration testing (if applicable)
- [ ] Staff security training
- [ ] Review and update policies

## ✅ Final Sign-Off

Before going live:

- [ ] All items in this checklist completed
- [ ] Security testing passed
- [ ] Backup system verified
- [ ] Team trained
- [ ] Documentation reviewed

**Signed:** _________________  
**Date:** _________________  
**Role:** _________________  

---

**Remember: Security is an ongoing process, not a one-time task!** 🔐


