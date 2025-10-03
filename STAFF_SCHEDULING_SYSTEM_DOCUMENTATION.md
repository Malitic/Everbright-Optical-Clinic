# Staff Scheduling System Documentation

This document describes the comprehensive staff scheduling system that supports both optometrists and staff members across all branches, with admin control and staff change request functionality.

## Overview

The staff scheduling system has been completely redesigned to support all staff types (optometrists and staff) across all branches, replacing the previous optometrist-only scheduling system. The new system provides:

- **Universal Staff Support**: Both optometrists and staff members can have schedules
- **Branch-Specific Scheduling**: Staff can be scheduled at different branches
- **Admin Control**: Complete administrative control over all schedules
- **Staff Change Requests**: Staff can request schedule changes that require admin approval
- **Audit Trail**: Complete tracking of who created and modified schedules
- **Backward Compatibility**: Existing optometrist schedules continue to work

## Database Changes

### Migration: `2024_01_15_000000_modify_schedules_for_all_staff.php`

The migration modifies the existing `schedules` and `schedule_change_requests` tables:

#### Schedules Table Changes:
- `optometrist_id` → `staff_id` (renamed for generic staff support)
- Added `staff_role` column (optometrist/staff)
- Added `created_by` and `updated_by` columns for audit trail
- Added foreign key constraints for audit fields

#### Schedule Change Requests Table Changes:
- `optometrist_id` → `staff_id` (renamed for generic staff support)
- Added `staff_role` column (optometrist/staff)
- Added `requested_by` column for audit trail
- Added foreign key constraint for requester

## API Endpoints

### Staff Management

#### Get Staff Members
**Endpoint:** `GET /api/staff-schedules/staff-members`

**Description:** Get all staff members (optometrists and staff) available for scheduling.

**Query Parameters:**
- `role` (optional): Filter by staff role (optometrist/staff)
- `branch_id` (optional): Filter by branch

**Response:**
```json
{
  "staff_members": [
    {
      "id": 1,
      "name": "Dr. Smith",
      "email": "dr.smith@example.com",
      "role": "optometrist",
      "branch": {
        "id": 1,
        "name": "Main Branch",
        "address": "123 Main St"
      }
    }
  ],
  "summary": {
    "total": 5,
    "optometrists": 3,
    "staff": 2
  }
}
```

#### Get Branches
**Endpoint:** `GET /api/staff-schedules/branches`

**Description:** Get all active branches for scheduling.

**Response:**
```json
{
  "branches": [
    {
      "id": 1,
      "name": "Main Branch",
      "address": "123 Main St",
      "phone": "555-0123",
      "email": "main@example.com"
    }
  ]
}
```

### Schedule Management

#### Get Branch Staff Schedules
**Endpoint:** `GET /api/staff-schedules/branch/{branchId}`

**Description:** Get all staff schedules for a specific branch.

**Authorization:** Admin, Staff, Optometrist (branch-specific access)

**Response:**
```json
{
  "branch": {
    "id": 1,
    "name": "Main Branch",
    "address": "123 Main St"
  },
  "staff_schedules": [
    {
      "staff_id": 1,
      "staff_name": "Dr. Smith",
      "staff_role": "optometrist",
      "email": "dr.smith@example.com",
      "schedules": [
        {
          "id": 1,
          "day_of_week": 1,
          "day_name": "Monday",
          "start_time": "09:00",
          "end_time": "17:00",
          "formatted_time": "9:00 AM - 5:00 PM",
          "is_active": true,
          "created_by": "Admin User",
          "updated_by": "Admin User",
          "created_at": "2024-01-15T10:00:00Z",
          "updated_at": "2024-01-15T10:00:00Z"
        }
      ]
    }
  ],
  "summary": {
    "total_staff": 3,
    "optometrists": 2,
    "staff": 1
  }
}
```

#### Get Individual Staff Schedule
**Endpoint:** `GET /api/staff-schedules/staff/{staffId}`

**Description:** Get schedule for a specific staff member.

**Authorization:** Admin, Staff, Optometrist (own schedule or admin)

**Response:**
```json
{
  "staff": {
    "id": 1,
    "name": "Dr. Smith",
    "email": "dr.smith@example.com",
    "role": "optometrist",
    "branch": {
      "id": 1,
      "name": "Main Branch",
      "address": "123 Main St"
    }
  },
  "schedules": [
    {
      "id": 1,
      "day_of_week": 1,
      "day_name": "Monday",
      "start_time": "09:00",
      "end_time": "17:00",
      "formatted_time": "9:00 AM - 5:00 PM",
      "branch": {
        "id": 1,
        "name": "Main Branch",
        "address": "123 Main St"
      },
      "is_active": true,
      "created_by": "Admin User",
      "updated_by": "Admin User",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Create or Update Schedule (Admin Only)
**Endpoint:** `POST /api/staff-schedules`

**Description:** Create or update a staff schedule.

**Authorization:** Admin only

**Request Body:**
```json
{
  "staff_id": 1,
  "staff_role": "optometrist",
  "branch_id": 1,
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "is_active": true
}
```

**Response:**
```json
{
  "message": "Schedule updated successfully",
  "schedule": {
    "id": 1,
    "staff": {
      "id": 1,
      "name": "Dr. Smith",
      "role": "optometrist"
    },
    "branch": {
      "id": 1,
      "name": "Main Branch"
    },
    "day_of_week": 1,
    "day_name": "Monday",
    "start_time": "09:00",
    "end_time": "17:00",
    "formatted_time": "9:00 AM - 5:00 PM",
    "is_active": true
  }
}
```

#### Delete Schedule (Admin Only)
**Endpoint:** `DELETE /api/staff-schedules/{scheduleId}`

**Description:** Delete a staff schedule.

**Authorization:** Admin only

**Response:**
```json
{
  "message": "Schedule deleted successfully"
}
```

### Schedule Change Requests

#### Get Change Requests
**Endpoint:** `GET /api/staff-schedules/change-requests`

**Description:** Get schedule change requests.

**Query Parameters:**
- `status` (optional): Filter by status (pending/approved/rejected)
- `staff_role` (optional): Filter by staff role (optometrist/staff)

**Authorization:** Admin (all requests), Staff/Optometrist (own requests)

**Response:**
```json
{
  "change_requests": [
    {
      "id": 1,
      "staff": {
        "id": 1,
        "name": "Dr. Smith",
        "role": "optometrist"
      },
      "branch": {
        "id": 1,
        "name": "Main Branch"
      },
      "day_of_week": 2,
      "day_name": "Tuesday",
      "start_time": "10:00",
      "end_time": "18:00",
      "reason": "Need to adjust schedule for personal appointment",
      "status": "pending",
      "admin_notes": null,
      "requester": "Dr. Smith",
      "reviewer": null,
      "reviewed_at": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Change Request
**Endpoint:** `POST /api/staff-schedules/change-requests`

**Description:** Create a schedule change request.

**Authorization:** Staff, Optometrist

**Request Body:**
```json
{
  "day_of_week": 2,
  "branch_id": 1,
  "start_time": "10:00",
  "end_time": "18:00",
  "reason": "Need to adjust schedule for personal appointment"
}
```

**Response:**
```json
{
  "message": "Schedule change request submitted successfully",
  "request": {
    "id": 1,
    "day_name": "Tuesday",
    "start_time": "10:00",
    "end_time": "18:00",
    "reason": "Need to adjust schedule for personal appointment",
    "status": "pending",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Approve Change Request (Admin Only)
**Endpoint:** `PUT /api/staff-schedules/change-requests/{requestId}/approve`

**Description:** Approve a schedule change request.

**Authorization:** Admin only

**Request Body:**
```json
{
  "admin_notes": "Approved - schedule change looks good"
}
```

**Response:**
```json
{
  "message": "Schedule change request approved successfully"
}
```

#### Reject Change Request (Admin Only)
**Endpoint:** `PUT /api/staff-schedules/change-requests/{requestId}/reject`

**Description:** Reject a schedule change request.

**Authorization:** Admin only

**Request Body:**
```json
{
  "admin_notes": "Rejected - conflicts with existing appointments"
}
```

**Response:**
```json
{
  "message": "Schedule change request rejected"
}
```

## Models

### Updated Schedule Model

The `Schedule` model has been updated to support all staff types:

```php
// New fillable fields
protected $fillable = [
    'staff_id',        // Renamed from optometrist_id
    'staff_role',      // New: optometrist or staff
    'branch_id',
    'day_of_week',
    'start_time',
    'end_time',
    'is_active',
    'created_by',      // New: audit trail
    'updated_by',      // New: audit trail
];

// New relationships
public function staff(): BelongsTo
{
    return $this->belongsTo(User::class, 'staff_id');
}

public function creator(): BelongsTo
{
    return $this->belongsTo(User::class, 'created_by');
}

public function updater(): BelongsTo
{
    return $this->belongsTo(User::class, 'updated_by');
}

// New scopes
public function scopeForStaff($query, $staffId)
public function scopeForRole($query, $role)
public function scopeOptometrists($query)
public function scopeStaff($query)
```

### Updated ScheduleChangeRequest Model

The `ScheduleChangeRequest` model has been updated similarly:

```php
// New fillable fields
protected $fillable = [
    'staff_id',        // Renamed from optometrist_id
    'staff_role',      // New: optometrist or staff
    'day_of_week',
    'branch_id',
    'start_time',
    'end_time',
    'reason',
    'status',
    'admin_notes',
    'reviewed_by',
    'reviewed_at',
    'requested_by',    // New: audit trail
];

// New relationships and scopes similar to Schedule model
```

## Authorization Rules

### Schedule Access
- **Admin**: Can view and manage all schedules
- **Staff/Optometrist**: Can view their own schedules and schedules for their branch
- **Customer**: No access to staff schedules

### Change Request Access
- **Admin**: Can view all change requests and approve/reject them
- **Staff/Optometrist**: Can view and create their own change requests
- **Customer**: No access to change requests

### Schedule Management
- **Admin**: Can create, update, and delete any schedule
- **Staff/Optometrist**: Cannot directly manage schedules (must use change requests)

## Backward Compatibility

The system maintains backward compatibility with existing optometrist schedules:

1. **Existing API endpoints** continue to work
2. **Optometrist-specific methods** are maintained
3. **Database migration** preserves existing data
4. **Model relationships** include backward-compatible methods

## Testing

### Test Files
1. **PHP Test Script**: `backend/test_staff_scheduling.php`
2. **HTML Test Dashboard**: `test_staff_scheduling_dashboard.html`

### Running Tests
```bash
# PHP Test
cd backend
php test_staff_scheduling.php

# HTML Test
# Open test_staff_scheduling_dashboard.html in browser
```

## Key Features

### ✅ Universal Staff Support
- Both optometrists and staff members can have schedules
- Role-based filtering and management
- Consistent API across all staff types

### ✅ Branch-Specific Scheduling
- Staff can be scheduled at different branches
- Branch-specific schedule views
- Cross-branch schedule management for admins

### ✅ Admin Control
- Complete administrative control over all schedules
- Direct schedule creation, update, and deletion
- Change request approval/rejection workflow

### ✅ Staff Change Request System
- Staff can request schedule changes
- Admin approval workflow
- Reason tracking and admin notes
- Status tracking (pending/approved/rejected)

### ✅ Audit Trail
- Complete tracking of who created and modified schedules
- Change request tracking
- Timestamp tracking for all operations

### ✅ Role-Based Access Control
- Different access levels for different user roles
- Secure API endpoints
- Proper authorization checks

### ✅ Backward Compatibility
- Existing optometrist schedules continue to work
- Gradual migration path
- No breaking changes to existing functionality

## Migration Guide

### For Existing Systems
1. Run the database migration
2. Update API calls to use new endpoints (optional)
3. Update frontend to use new staff scheduling features
4. Train staff on new change request workflow

### For New Implementations
1. Use the new staff scheduling endpoints
2. Implement the change request workflow
3. Set up proper role-based access control
4. Configure audit trail monitoring

## Future Enhancements

- **Recurring Schedules**: Support for recurring schedule patterns
- **Schedule Templates**: Predefined schedule templates for common patterns
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Notification System**: Email/SMS notifications for schedule changes
- **Mobile App Support**: Mobile-optimized schedule management
- **Advanced Reporting**: Detailed scheduling analytics and reports
