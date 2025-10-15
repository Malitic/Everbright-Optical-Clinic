# 🛡️ Quick Safe Commands Reference

## ✅ SAFE - Use These Anytime

```bash
# View migration status
php artisan migrate:status

# Run pending migrations (adds new tables/columns)
php artisan migrate

# Create database backup
php artisan db:backup

# Check database contents
php artisan tinker --execute="echo 'Users: ' . App\Models\User::count();"
```

---

## ⚠️ USE WITH CAUTION

```bash
# Rollback last migration (1 step only)
php artisan migrate:rollback --step=1

# Seed database (NOW PROTECTED - won't run if data exists)
php artisan db:seed
```

---

## ❌ DANGEROUS - NEVER USE (Unless you want to lose ALL data)

```bash
# 🚨 DELETES EVERYTHING
php artisan migrate:fresh

# 🚨 DELETES EVERYTHING AND SEEDS
php artisan migrate:fresh --seed

# 🚨 DROPS ALL TABLES
php artisan migrate:reset
```

---

## 🔄 Safe Workflow Example

```bash
# 1. ALWAYS backup first
php artisan db:backup

# 2. Run migration
php artisan migrate

# 3. Verify it worked
php artisan migrate:status
```

---

## 🆘 Emergency Recovery

```bash
# If something goes wrong, restore from backup:
# Location: backend/storage/backups/database/

# Windows:
Copy-Item "backend\storage\backups\database\database_backup_LATEST.sqlite" "backend\database\database.sqlite" -Force

# Linux/Mac:
cp backend/storage/backups/database/database_backup_LATEST.sqlite backend/database/database.sqlite
```

---

## 📖 Full Documentation

See: `backend/⚠️_IMPORTANT_DATABASE_SAFETY.md`

