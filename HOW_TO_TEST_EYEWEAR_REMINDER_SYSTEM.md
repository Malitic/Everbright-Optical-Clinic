# 🧪 How to Test the Eyewear Condition Reminder System

## 🔍 **Testing Checklist**

### **1. Backend API Testing**

#### **Test the Reminders Endpoint:**
```bash
# Test getting reminders (replace with your actual token)
curl -X GET "http://localhost:8000/api/eyewear/reminders" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "reminders": [
    {
      "id": "123",
      "eyewear_id": "456", 
      "eyewear_label": "Ray-Ban Aviator",
      "next_check_date": "2024-01-20",
      "assessment_date": "2024-01-15",
      "assessed_by": "Dr. Smith",
      "priority": "medium",
      "is_overdue": true
    }
  ],
  "count": 1
}
```

#### **Test Self-Check Form Submission:**
```bash
curl -X POST "http://localhost:8000/api/eyewear/456/condition-form" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lens_clarity": "slightly_blurry",
    "frame_condition": "loose", 
    "eye_discomfort": "mild",
    "remarks": "Right lens seems scratched"
  }'

# Expected Response:
{
  "message": "Self-check submitted successfully",
  "notification_id": "789"
}
```

#### **Test Appointment Scheduling:**
```bash
curl -X POST "http://localhost:8000/api/eyewear/456/set-appointment" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_date": "2024-01-25",
    "preferred_time": "14:00",
    "notes": "Eyewear feels loose, needs adjustment"
  }'

# Expected Response:
{
  "message": "Appointment scheduled successfully", 
  "appointment_id": "101"
}
```

---

## 🎯 **Frontend Testing Steps**

### **Step 1: Check Customer Dashboard**

1. **Login as Customer:**
   - Go to `/customer/dashboard`
   - Look for "Eyewear Check Reminders" section
   - Should see floating popup cards if reminders exist

2. **What to Look For:**
   ```
   ✅ "Eyewear Check Reminders" heading appears
   ✅ Reminder count badge shows correct number
   ✅ Floating popup cards with priority colors
   ✅ Two action buttons: "Quick Self-Check" and "Schedule Appointment"
   ```

### **Step 2: Test Self-Check Form**

1. **Click "Quick Self-Check" Button:**
   - Modal should open with form
   - Form should show eyewear details
   - All dropdowns should work

2. **Fill Out Form:**
   - Select lens clarity option
   - Select frame condition option  
   - Select eye discomfort level
   - Add optional remarks
   - Click "Submit Self-Check"

3. **Expected Results:**
   ```
   ✅ Form submits successfully
   ✅ Success toast notification appears
   ✅ Modal closes automatically
   ✅ Reminder disappears from dashboard
   ✅ Staff receives notification (check admin panel)
   ```

### **Step 3: Test Appointment Scheduling**

1. **Click "Schedule Appointment" Button:**
   - Modal should open with appointment form
   - Date picker should work
   - Time dropdown should have options

2. **Fill Out Appointment Form:**
   - Select future date
   - Choose preferred time
   - Add notes
   - Click "Schedule Appointment"

3. **Expected Results:**
   ```
   ✅ Appointment submits successfully
   ✅ Success toast notification appears
   ✅ Modal closes automatically
   ✅ Reminder disappears from dashboard
   ✅ New appointment appears in appointments list
   ✅ Staff receives notification (check admin panel)
   ```

---

## 🔧 **Database Verification**

### **Check Notifications Table:**
```sql
-- Check if reminders exist
SELECT * FROM notifications 
WHERE type = 'eyewear_condition' 
AND JSON_EXTRACT(data, '$.reminder_type') = 'scheduled_check';

-- Check if self-checks were submitted
SELECT * FROM notifications 
WHERE type = 'eyewear_self_check';

-- Check if appointments were created
SELECT * FROM appointments 
WHERE notes LIKE '%Eyewear condition check%';
```

### **Check Staff Notifications:**
```sql
-- Check if staff received notifications
SELECT * FROM notifications 
WHERE role = 'staff' 
AND (type = 'eyewear_self_check' OR type = 'appointment_request');
```

---

## 🚨 **Troubleshooting Common Issues**

### **Issue 1: No Reminders Showing**
**Possible Causes:**
- No reminders exist in database
- Customer token invalid
- API endpoint not accessible

**Solutions:**
```bash
# Check if reminders exist
curl -X GET "http://localhost:8000/api/eyewear/reminders" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check browser console for errors
# Verify customer is logged in
```

### **Issue 2: Form Not Submitting**
**Possible Causes:**
- Validation errors
- Network issues
- Missing required fields

**Solutions:**
```bash
# Check browser console for errors
# Verify all required fields are filled
# Check network tab for failed requests
```

### **Issue 3: Staff Not Getting Notifications**
**Possible Causes:**
- WebSocket not connected
- Staff user doesn't exist
- Notification creation failed

**Solutions:**
```bash
# Check WebSocket connection
# Verify staff users exist in database
# Check notification creation logs
```

---

## 📊 **Success Indicators**

### **✅ Backend Working If:**
- API endpoints return correct responses
- Database records are created
- Staff notifications are generated
- Validation works properly

### **✅ Frontend Working If:**
- Reminders load on dashboard
- Forms submit successfully
- Modals open and close properly
- Toast notifications appear
- Reminders disappear after action

### **✅ Integration Working If:**
- Customer actions trigger staff notifications
- Appointments are created in system
- Real-time updates work via WebSocket
- Data persists correctly

---

## 🧪 **Manual Testing Scenarios**

### **Scenario 1: Complete Self-Check Flow**
1. Login as customer
2. Go to dashboard
3. Click "Quick Self-Check" on reminder
4. Fill out form completely
5. Submit form
6. Verify success message
7. Check that reminder disappears
8. Login as staff and verify notification received

### **Scenario 2: Complete Appointment Flow**
1. Login as customer
2. Go to dashboard  
3. Click "Schedule Appointment" on reminder
4. Select future date and time
5. Add notes
6. Submit appointment
7. Verify success message
8. Check appointments page for new appointment
9. Login as staff and verify notification received

### **Scenario 3: Error Handling**
1. Try submitting form with missing fields
2. Try selecting past date for appointment
3. Try submitting with invalid data
4. Verify error messages appear
5. Verify form doesn't submit

---

## 🔍 **Browser Developer Tools Testing**

### **Console Checks:**
```javascript
// Check if reminders are loading
console.log('Eyewear reminders:', window.eyewearReminders);

// Check for API errors
// Look for failed network requests in Network tab

// Check for JavaScript errors
// Look for red error messages in Console tab
```

### **Network Tab Checks:**
```
✅ GET /api/eyewear/reminders - Status 200
✅ POST /api/eyewear/{id}/condition-form - Status 200  
✅ POST /api/eyewear/{id}/set-appointment - Status 200
✅ POST /api/notifications/mark-read - Status 200
```

---

## 📱 **Mobile Testing**

### **Test on Mobile Device:**
1. Open customer dashboard on mobile
2. Verify reminders display properly
3. Test form interactions with touch
4. Verify modals work on small screens
5. Test submission process

### **Mobile-Specific Checks:**
```
✅ Touch targets are large enough
✅ Forms are mobile-friendly
✅ Modals fit on screen
✅ Buttons are easy to tap
✅ Text is readable
```

---

## 🎯 **Quick Test Script**

### **5-Minute Test:**
1. **Login as customer** → Go to dashboard
2. **Look for reminders** → Should see "Eyewear Check Reminders" section
3. **Click self-check** → Form should open
4. **Fill and submit** → Should see success message
5. **Check staff panel** → Staff should see notification

### **If Everything Works:**
```
✅ Reminders appear on dashboard
✅ Forms open and submit successfully  
✅ Success messages show
✅ Staff get notifications
✅ Reminders disappear after action
```

### **If Something Doesn't Work:**
```
❌ Check browser console for errors
❌ Check network tab for failed requests
❌ Verify API endpoints are accessible
❌ Check database for created records
❌ Verify user permissions and tokens
```

---

## 🚀 **Production Deployment Checklist**

### **Before Going Live:**
- [ ] Test all API endpoints
- [ ] Verify database integration
- [ ] Test WebSocket connections
- [ ] Check mobile responsiveness
- [ ] Verify staff notifications work
- [ ] Test error handling
- [ ] Check performance with multiple users
- [ ] Verify security (authentication/authorization)

### **Monitoring After Launch:**
- [ ] Monitor API response times
- [ ] Check error logs regularly
- [ ] Monitor customer usage patterns
- [ ] Track staff notification responses
- [ ] Monitor database performance

---

**The system is working if you can complete the 5-minute test successfully!** 🎉

If you encounter any issues, check the troubleshooting section above or look at the browser console for specific error messages.
