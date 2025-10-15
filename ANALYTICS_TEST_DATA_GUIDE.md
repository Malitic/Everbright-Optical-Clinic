# 📊 Analytics Test Data Seeder Guide

## 🎯 **Purpose**
Generate 2 months of realistic fake analytics data **safely** without affecting your existing real data.

---

## 🛡️ **Safety Features**

### **Automatic Safety Check:**
```php
// Only runs if NO recent data exists (last 60 days)
if (Appointment::whereDate('created_at', '>=', now()->subDays(60))->exists()) return;
```

### **Multiple Protection Layers:**
- ✅ **Date Range Check** - Only creates data older than 60 days
- ✅ **Existence Check** - Blocks if recent appointments/receipts/feedback exist
- ✅ **Confirmation Required** - Force mode requires explicit confirmation
- ✅ **Realistic Data** - Uses existing users, products, and branches
- ✅ **Proper Relationships** - Links appointments to prescriptions to receipts

---

## 🚀 **Usage Options**

### **Option 1: Safe Seeding (Recommended)**
```bash
php artisan analytics:seed-test-data
```
- ✅ **Automatic safety checks**
- ✅ **Won't overwrite existing data**
- ✅ **Shows detailed progress**
- ✅ **Provides data summary**

### **Option 2: Force Seeding (Use with Caution)**
```bash
php artisan analytics:seed-test-data --force
```
- ⚠️ **Bypasses safety checks**
- ⚠️ **May create duplicate data**
- ⚠️ **Requires confirmation**
- ⚠️ **Only for testing environments**

### **Option 3: Direct Seeder**
```bash
php artisan db:seed --class=AnalyticsTestSeeder
```
- ✅ **Uses safety checks**
- ✅ **Good for automated scripts**

---

## 📊 **What Data Gets Generated**

### **📅 Appointments (2 months)**
- **Quantity:** ~200-400 appointments
- **Types:** Eye Examination, Contact Lens Fitting, Follow-up, Emergency, Consultation
- **Status:** 60% completed, 20% cancelled, 20% no-show
- **Schedule:** 2-8 appointments per day (excluding Sundays)
- **Time Slots:** Realistic business hours (9 AM - 4:30 PM)

### **💊 Prescriptions (70% of completed appointments)**
- **Types:** Glasses, Contact Lenses, Sunglasses, Progressive, Bifocal
- **Data:** Realistic prescription values (sphere, cylinder, axis, PD)
- **Duration:** 1-year validity from appointment date

### **🧾 Receipts (60% of completed appointments)**
- **Contents:** Product sales + Eye examination fees
- **Payment Methods:** Cash, Card, GCash
- **Tax Calculation:** Proper VAT computation (12%)
- **Receipt Numbers:** Sequential TEST-000001, TEST-000002, etc.

### **💬 Feedback (40% of completed appointments)**
- **Ratings:** Mostly positive (4-5 stars)
- **Comments:** Realistic customer feedback
- **Timing:** Created 1-7 days after appointment

### **📦 Inventory Updates**
- **Stock Levels:** Realistic quantities (50-200 per product)
- **Thresholds:** Low stock alerts (5-15 items)
- **Branches:** Updated for all product-branch combinations

---

## 🔍 **Example Output**

```
🔍 Analytics Test Data Seeder Starting...

✅ Safety check passed - No recent data found
📊 Generating 2 months of realistic analytics test data...

📅 Date range: 2024-10-15 to 2024-12-14
🏢 Branches: 3
👥 Customers: 25
👨‍⚕️ Optometrists: 8
🛍️ Products: 45

📅 Generating appointments...
  ✅ Created 387 appointments
💊 Generating prescriptions...
  ✅ Created 271 prescriptions
🧾 Generating receipts...
  ✅ Created 232 receipts
💬 Generating feedback...
  ✅ Created 155 feedback entries
📦 Generating inventory updates...
  ✅ Updated inventory for 135 product-branch combinations

✅ Analytics test data generation completed successfully!
📊 You now have 2 months of realistic test data for analytics testing
```

---

## 🧪 **Testing Your Analytics**

### **1. Run Analytics Command:**
```bash
php artisan analytics:generate --days=30
```

### **2. Check Frontend Dashboard:**
- Visit your analytics dashboard
- Verify charts show realistic data
- Test date range filters

### **3. Verify Data Relationships:**
```bash
php artisan tinker
```
```php
// Check appointment data
Appointment::where('status', 'completed')->count();

// Check prescriptions linked to appointments
Prescription::whereHas('appointment')->count();

// Check receipts with proper totals
Receipt::sum('total_due');

// Check feedback ratings
Feedback::avg('rating');
```

---

## 🗑️ **Cleaning Up Test Data**

### **Option 1: Fresh Database (Recommended)**
```bash
php artisan migrate:fresh --seed
```
- ✅ **Completely clean slate**
- ✅ **Re-runs all seeders**
- ✅ **Removes all test data**

### **Option 2: Selective Cleanup**
```bash
php artisan tinker
```
```php
// Remove test data only (be careful!)
Appointment::where('created_at', '>=', now()->subDays(60))->delete();
Receipt::where('receipt_number', 'like', 'TEST-%')->delete();
Feedback::where('created_at', '>=', now()->subDays(60))->delete();
```

---

## 🎯 **Use Cases**

### **Perfect For:**
- ✅ **Analytics Testing** - See how charts look with realistic data
- ✅ **Performance Testing** - Test with larger datasets
- ✅ **Demo Purposes** - Show realistic system behavior
- ✅ **Development** - Work with meaningful data
- ✅ **Training** - Practice with realistic scenarios

### **Not Recommended For:**
- ❌ **Production Data** - Never use on live customer data
- ❌ **Performance Benchmarks** - Use dedicated performance data
- ❌ **Real Analytics** - Use actual business data for real insights

---

## 🔧 **Customization**

### **Adjust Date Range:**
Edit `AnalyticsTestSeeder.php`:
```php
// Change from 60 days to any period
$startDate = Carbon::now()->subDays(90); // 3 months
```

### **Modify Data Volume:**
```php
// Change appointments per day
$appointmentsPerDay = rand(5, 15); // More appointments

// Change feedback percentage
if (rand(1, 100) <= 60) { // 60% instead of 40%
```

### **Add Custom Data:**
```php
// Add your own realistic data generation
$this->generateCustomData($startDate, $endDate);
```

---

## 🚨 **Troubleshooting**

### **"Recent Data Exists" Error:**
```
⚠️ RECENT DATA EXISTS - SEEDING BLOCKED!
```
**Solution:** This is working as intended! The seeder protects your existing data.
- Use `--force` flag only if you're sure
- Or clean up recent data first

### **"Insufficient Base Data" Error:**
```
❌ Insufficient base data found
```
**Solution:** Run the main seeders first:
```bash
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=ProductSeeder
php artisan db:seed --class=BranchSeeder
```

### **Memory Issues:**
**Solution:** Increase PHP memory limit:
```bash
php -d memory_limit=512M artisan analytics:seed-test-data
```

---

## 🎉 **Result**

After running this seeder, you'll have:
- **2 months of realistic test data**
- **Proper data relationships** (appointments → prescriptions → receipts)
- **Realistic analytics charts** for testing
- **Safe data generation** that won't affect real data
- **Professional-looking dashboards** for demos

Your analytics system will now have meaningful data to work with! 📊✨
