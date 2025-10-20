# 🔍 Debug: No Buttons Showing - Step by Step Troubleshooting

## 🚨 **Immediate Debug Steps**

### **Step 1: Check Browser Console**
1. **Open customer dashboard** (`/customer/dashboard`)
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for any red error messages**

**Common errors to look for:**
- `Failed to load eyewear reminders: ...`
- `Cannot read property of undefined`
- `Module not found` errors
- Network request failures

### **Step 2: Check Network Tab**
1. **Go to Network tab** in Developer Tools
2. **Refresh the page**
3. **Look for API requests:**
   - `GET /api/eyewear/reminders` - Should return 200 status
   - Any failed requests (red status codes)

### **Step 3: Check if Data is Loading**
Add this temporary debug code to see what's happening:

```javascript
// Add this to CustomerDashboard.tsx temporarily
console.log('Debug Info:', {
  user: user,
  eyewearReminders: eyewearReminders,
  loadingReminders: loadingReminders,
  remindersLength: eyewearReminders.length
});
```

---

## 🔧 **Quick Fixes**

### **Fix 1: Check API Endpoint**
Test if the API endpoint is working:

```bash
# Test the API directly
curl -X GET "http://localhost:8000/api/eyewear/reminders" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "reminders": [],
  "count": 0
}
```

### **Fix 2: Create Test Data**
If API works but returns empty array, create test data:

```sql
-- Find customer ID first
SELECT id, name, email FROM users WHERE role = 'customer' LIMIT 1;

-- Create test reminder (replace 1 with actual customer ID)
INSERT INTO notifications (user_id, role, title, message, type, data, status, created_at, updated_at) 
VALUES (1, 'customer', 'Eyewear Condition Assessment', 'Test reminder', 'eyewear_condition', 
JSON_OBJECT('eyewear_id', '123', 'eyewear_label', 'Test Eyewear', 'condition', 'needs_fix', 
'assessment_date', '2024-01-15', 'next_check_date', '2024-01-20', 'notes', 'Test', 
'assessed_by', 'Dr. Test', 'assessed_by_id', 1, 'priority', 'medium', 'reminder_type', 'scheduled_check'), 
'unread', NOW(), NOW());
```

### **Fix 3: Check Component Rendering**
Add debug info to see if component is rendering:

```jsx
// Add this in CustomerDashboard.tsx after line 186
{console.log('Rendering reminders section:', eyewearReminders.length > 0)}
{eyewearReminders.length > 0 && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Bell className="h-5 w-5 text-blue-500" />
        Eyewear Check Reminders
      </h2>
      <Badge variant="outline" className="bg-blue-50 text-blue-700">
        {eyewearReminders.length} reminder{eyewearReminders.length !== 1 ? 's' : ''}
      </Badge>
    </div>
    {eyewearReminders.map(reminder => (
      <EyewearReminderPopup
        key={reminder.id}
        reminder={reminder}
        onDismiss={handleDismissReminder}
        onSubmitSelfCheck={handleSelfCheckSubmit}
        onScheduleAppointment={handleAppointmentSubmit}
      />
    ))}
  </div>
)}
```

---

## 🧪 **Step-by-Step Testing**

### **Test 1: Check if API is Working**
1. **Open browser console**
2. **Go to customer dashboard**
3. **Look for this log:** `Failed to load eyewear reminders:`
4. **If you see an error, the API is not working**

### **Test 2: Check if Data Exists**
1. **Run this SQL query:**
```sql
SELECT * FROM notifications 
WHERE type = 'eyewear_condition' 
AND JSON_EXTRACT(data, '$.reminder_type') = 'scheduled_check';
```
2. **If no results, create test data using the SQL above**

### **Test 3: Check Component Loading**
1. **Add debug console.log** (see Fix 3 above)
2. **Refresh dashboard**
3. **Check console for:** `Rendering reminders section: true/false`

### **Test 4: Check Authentication**
1. **Verify customer is logged in**
2. **Check if token exists:** `sessionStorage.getItem('auth_token')`
3. **Verify token is valid**

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: API Returns 401 Unauthorized**
**Solution:**
- Check if customer is logged in
- Verify authentication token
- Check token expiration

### **Issue 2: API Returns 404 Not Found**
**Solution:**
- Verify API endpoint exists
- Check if routes are properly defined
- Ensure backend server is running

### **Issue 3: API Returns Empty Array**
**Solution:**
- Create test data in database
- Verify customer ID matches notification user_id
- Check notification type and data structure

### **Issue 4: Component Not Rendering**
**Solution:**
- Check for JavaScript errors
- Verify component imports
- Check if conditional rendering logic is correct

---

## 🔍 **Debug Checklist**

### **Backend Issues:**
- [ ] API endpoint exists (`/api/eyewear/reminders`)
- [ ] Routes are properly defined
- [ ] Controller method exists
- [ ] Database connection works
- [ ] Authentication middleware works

### **Frontend Issues:**
- [ ] Component imports correctly
- [ ] API service functions exist
- [ ] State management works
- [ ] Conditional rendering logic correct
- [ ] No JavaScript errors

### **Data Issues:**
- [ ] Test data exists in database
- [ ] Customer user exists
- [ ] Notification type is correct
- [ ] Data structure matches expected format

---

## 🎯 **Quick Test Method**

### **5-Minute Debug:**
1. **Open browser console** → Look for errors
2. **Check Network tab** → Look for failed API calls
3. **Run SQL query** → Check if test data exists
4. **Create test data** → If none exists
5. **Refresh dashboard** → Should see reminders

### **Expected Console Output:**
```
Debug Info: {
  user: {id: 1, name: "Customer", role: "customer"},
  eyewearReminders: [{id: "123", eyewear_label: "Test Eyewear", ...}],
  loadingReminders: false,
  remindersLength: 1
}
```

---

## 🚀 **If Still Not Working**

### **Create Minimal Test:**
Add this simple test to CustomerDashboard:

```jsx
// Add this right after the welcome message
<div style={{background: 'yellow', padding: '10px', margin: '10px'}}>
  <h3>Debug Info:</h3>
  <p>User ID: {user?.id}</p>
  <p>Reminders Count: {eyewearReminders.length}</p>
  <p>Loading: {loadingReminders ? 'Yes' : 'No'}</p>
  <p>Reminders: {JSON.stringify(eyewearReminders)}</p>
</div>
```

This will show you exactly what data is available and help identify the issue.

---

**The most likely issue is that there's no test data in the database. Create the test data using the SQL above, and the buttons should appear!** 🎯
