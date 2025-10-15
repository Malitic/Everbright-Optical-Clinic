# 🏥 EverBright Optical Clinic - System Configuration

## Current System Setup

### Doctor Information

**Active Optometrist:**
- **Name:** Dr. Samuel Loreto Prieto
- **Email:** samuel.prieto@everbright.com
- **User ID:** 26
- **Role:** Optometrist

### Clinic Rotation Schedule (4 Branches)

Dr. Samuel Loreto Prieto operates on a **6-day rotation** across **4 clinic branches**:

| Day | Branch | Location | Working Hours |
|-----|--------|----------|---------------|
| **Monday** | Emerald Branch | Branch ID: 1 | 9:00 AM - 5:00 PM |
| **Tuesday** | Unitop Branch | Branch ID: 2 | 9:00 AM - 5:00 PM |
| **Wednesday** | Newstar Branch | Branch ID: 3 | 9:00 AM - 5:00 PM |
| **Thursday** | Garnet Branch | Branch ID: 4 | 9:00 AM - 5:00 PM |
| **Friday** | Emerald Branch | Branch ID: 1 | 9:00 AM - 5:00 PM |
| **Saturday** | Unitop Branch | Branch ID: 2 | 9:00 AM - 5:00 PM |
| **Sunday** | Closed | - | No Services |

### Branch Summary

#### 1. 💎 Emerald Branch (ID: 1)
- **Days:** Monday, Friday
- **Frequency:** 2 days per week

#### 2. 🏢 Unitop Branch (ID: 2)
- **Days:** Tuesday, Saturday
- **Frequency:** 2 days per week

#### 3. ⭐ Newstar Branch (ID: 3)
- **Days:** Wednesday
- **Frequency:** 1 day per week

#### 4. 🔴 Garnet Branch (ID: 4)
- **Days:** Thursday
- **Frequency:** 1 day per week

---

## Appointment Booking System

### How It Works for Customers

1. **View Schedule**
   - Customers see Dr. Samuel's full 6-day rotation schedule
   - Schedule displays which branch he's at each day
   - Green badges indicate availability

2. **Book Appointment**
   - Select preferred date
   - System automatically shows available times for that day's branch
   - System validates availability in real-time

3. **Services Offered**
   - Eye Examination
   - Contact Lens Fitting
   - Consultation
   - Follow-up
   - Emergency

### Frontend Implementation

**Pages:**
- `BookAppointmentPage.tsx` - Main booking interface with schedule display
- `DoctorScheduleModal.tsx` - Detailed weekly schedule view
- `CompactSchedule.tsx` - Compact schedule widget

**Logic:**
- System automatically selects Dr. Samuel (only optometrist)
- Schedule fetched from: `GET /api/schedules/doctor/26`
- Availability checked per branch and day

---

## Database Configuration

### Users Table (Optometrists)
```sql
-- Primary Optometrist
ID: 26
Name: Dr. Samuel Loreto Prieto
Email: samuel.prieto@everbright.com
Role: optometrist
Status: Active
```

### Schedules Table
```sql
-- 6 Active Schedules (one per working day)
Schedule IDs: 6, 7, 8, 9, 10, 11
Staff ID: 26
Staff Role: optometrist
Active: Yes
```

### Branches Table
```sql
-- 4 Active Branches
Branch IDs: 1, 2, 3, 4
Names: Emerald, Unitop, Newstar, Garnet
All Branches: Active
```

---

## System Behavior

### Automatic Selection
When customers visit the booking page:
1. System queries all optometrists
2. Finds Dr. Samuel Loreto Prieto (ID: 26) by name and email
3. Automatically selects him as the doctor
4. Loads his 6-day rotation schedule
5. Displays schedule prominently at top of page

### Schedule Display
- **Compact View:** Shows all 6 days with branches and times
- **Full Modal:** Detailed table with icons and status badges
- **Today Highlighting:** Current day is highlighted in blue
- **Status Indicators:** Green badges for "Available" days

### Branch Routing
- Customers select a date
- System determines which branch based on day of week
- Available time slots loaded for that specific branch
- Appointment created with correct branch assignment

---

## Important Notes

### Single Doctor System
- **Current Setup:** One optometrist only
- **Future Scaling:** System supports multiple doctors
- **To Add More Doctors:**
  1. Create new user with role "optometrist"
  2. Admin creates schedules via Employee Schedules page
  3. Frontend will automatically detect and list new doctor

### Schedule Management
- **Managed By:** Admin only
- **Access Via:** Admin Dashboard → Employee Schedules
- **Modification:** Admin can add/edit/disable schedules
- **Real-time Updates:** Changes reflect immediately in booking system

### Branch Coverage
- **All 4 branches** have optometry services via rotation
- **Customers can book** at any of the 4 branches
- **System ensures** doctor is scheduled at selected branch before confirming

---

## API Endpoints

### Schedule Endpoints
```bash
# Get doctor's weekly schedule
GET /api/schedules/doctor/26

# Get all optometrists
GET /api/optometrists

# Check availability for specific date
GET /api/appointments/availability?date=2025-10-13

# Book appointment
POST /api/appointments
```

### Response Format
```json
{
  "doctor": {
    "id": 26,
    "name": "Dr. Samuel Loreto Prieto",
    "email": "samuel.prieto@everbright.com"
  },
  "schedule": [
    {
      "day": "Monday",
      "branch": "Emerald Branch",
      "time": "9:00 AM - 5:00 PM",
      "day_of_week": 1,
      "branch_id": 1
    },
    // ... 5 more days
  ]
}
```

---

## Customer Experience

### What Customers See

**1. Booking Page Header:**
```
📅 Doctor's Weekly Schedule
View Dr. Samuel Loreto Prieto's availability across all branches

[View Full Schedule Button]
```

**2. Compact Schedule Widget:**
```
✅ Monday    - Emerald Branch  - 9:00 AM - 5:00 PM [Available]
✅ Tuesday   - Unitop Branch   - 9:00 AM - 5:00 PM [Available]
✅ Wednesday - Newstar Branch  - 9:00 AM - 5:00 PM [Available]
✅ Thursday  - Garnet Branch   - 9:00 AM - 5:00 PM [Available]
✅ Friday    - Emerald Branch  - 9:00 AM - 5:00 PM [Available]
✅ Saturday  - Unitop Branch   - 9:00 AM - 5:00 PM [Available]
```

**3. Booking Form:**
- Date selector
- Time slots (auto-populated based on date)
- Service type dropdown
- Notes field
- Submit button

---

## Testing & Verification

### Verify Doctor Schedule
```bash
# Check database directly
cd backend
php artisan tinker

# Run these commands:
$doctor = User::where('email', 'samuel.prieto@everbright.com')->first();
echo "Doctor: {$doctor->name} (ID: {$doctor->id})";

$schedules = Schedule::where('staff_id', 26)->where('is_active', true)->count();
echo "Active Schedules: {$schedules}";
```

### Verify API Response
```bash
# Test schedule endpoint
curl http://localhost:8000/api/schedules/doctor/26

# Should return 6 schedules across 4 branches
```

### Verify Frontend Display
1. Navigate to: `http://localhost:5173/book-appointment`
2. Should see: "Dr. Samuel Loreto Prieto's Weekly Schedule" at top
3. Should show: 6 days with green "Available" badges
4. Click "View Full Schedule" - should open detailed modal

---

## Status

✅ **Single Doctor Configuration** - Active  
✅ **4 Branch Rotation** - Configured  
✅ **6-Day Schedule** - Complete  
✅ **Customer Booking** - Functional  
✅ **Real-time Availability** - Working  

---

## Last Updated
October 12, 2025

## Configuration Verified By
System Administrator - Based on production database analysis



