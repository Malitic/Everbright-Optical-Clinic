# Role-based Analytics API Documentation

This document describes the role-based analytics endpoints implemented for the Laravel backend. These endpoints provide comprehensive analytics data tailored to different user roles in the system.

## Overview

The analytics system provides four main endpoints, each designed for a specific user role:

1. **Customer Analytics** - Personal vision history, prescriptions, and appointments
2. **Optometrist Analytics** - Professional workload, prescriptions issued, and patient compliance
3. **Staff Analytics** - Branch-specific performance, sales, and inventory data
4. **Admin Analytics** - System-wide performance, branch comparisons, and comprehensive reports

## Authentication

All endpoints require authentication via Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer your_token_here
```

## Endpoints

### 1. Customer Analytics

**Endpoint:** `GET /api/customers/{id}/analytics`

**Description:** Returns comprehensive analytics data for a specific customer, including vision history, prescription trends, and appointment statistics.

**Authorization:** 
- Customer can access their own data
- Admin, Optometrist, and Staff can access any customer's data

**Response Structure:**
```json
{
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "vision_history": [
    {
      "date": "2024-01-15",
      "prescription_number": "RX001",
      "right_eye": {
        "sph": -2.5,
        "cyl": -0.75,
        "axis": 90
      },
      "left_eye": {
        "sph": -2.25,
        "cyl": -0.5,
        "axis": 85
      },
      "expiry_date": "2025-01-15",
      "status": "active",
      "is_expired": false
    }
  ],
  "appointment_history": [
    {
      "id": 1,
      "date": "2024-01-15",
      "time": "10:00",
      "type": "routine",
      "status": "completed",
      "optometrist": {
        "name": "Dr. Smith",
        "id": 2
      },
      "branch": {
        "name": "Main Branch",
        "address": "123 Main St"
      }
    }
  ],
  "statistics": {
    "appointments": {
      "total": 5,
      "completed": 4,
      "missed": 1,
      "upcoming": 0,
      "completion_rate": 80.0
    },
    "prescriptions": {
      "total": 3,
      "active": 2,
      "expired": 1,
      "expiry_rate": 33.3
    }
  },
  "vision_trends": {
    "trend_available": true,
    "right_eye": {
      "sph_trend": "stable",
      "cyl_trend": "decreasing"
    },
    "left_eye": {
      "sph_trend": "increasing",
      "cyl_trend": "stable"
    }
  }
}
```

### 2. Optometrist Analytics

**Endpoint:** `GET /api/optometrists/{id}/analytics`

**Description:** Returns professional analytics for optometrists, including appointment statistics, prescriptions issued, and patient compliance data.

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Authorization:**
- Optometrist can access their own data
- Admin and Staff can access any optometrist's data

**Response Structure:**
```json
{
  "optometrist": {
    "id": 2,
    "name": "Dr. Smith",
    "email": "dr.smith@example.com",
    "branch": {
      "name": "Main Branch",
      "address": "123 Main St"
    }
  },
  "period": {
    "days": 30,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "appointments": {
    "daily": [
      {
        "date": "2024-01-15",
        "total": 8,
        "completed": 7,
        "cancelled": 1,
        "scheduled": 0
      }
    ],
    "total": 120,
    "completed": 110,
    "cancelled": 8,
    "scheduled": 2
  },
  "prescriptions": {
    "total_issued": 95,
    "by_type": {
      "routine": 60,
      "follow_up": 25,
      "emergency": 10
    },
    "by_status": {
      "active": 80,
      "expired": 15
    }
  },
  "follow_up_compliance": {
    "total_appointments": 120,
    "completed": 110,
    "cancelled": 8,
    "compliance_rate": 91.7
  },
  "workload_distribution": {
    "by_type": {
      "routine": 80,
      "follow_up": 30,
      "emergency": 10
    },
    "by_status": {
      "completed": 110,
      "cancelled": 8,
      "scheduled": 2
    },
    "by_weekday": {
      "Monday": 25,
      "Tuesday": 20,
      "Wednesday": 18,
      "Thursday": 22,
      "Friday": 15
    }
  }
}
```

### 3. Staff Analytics

**Endpoint:** `GET /api/staff/{id}/analytics`

**Description:** Returns branch-specific analytics for staff members, including appointment management, sales performance, and inventory status.

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Authorization:**
- Staff can access their own data
- Admin can access any staff member's data

**Response Structure:**
```json
{
  "staff": {
    "id": 3,
    "name": "Jane Staff",
    "email": "jane@example.com",
    "branch": {
      "id": 1,
      "name": "Main Branch",
      "address": "123 Main St"
    }
  },
  "period": {
    "days": 30,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "appointments": {
    "total": 150,
    "completed": 140,
    "cancelled": 8,
    "scheduled": 2,
    "no_show_rate": 5.3
  },
  "sales": {
    "total_reservations": 75,
    "completed_reservations": 70,
    "total_revenue": 15750.00,
    "average_order_value": 225.00
  },
  "inventory": {
    "total_items": 45,
    "total_stock": 1200,
    "low_stock_items": 3,
    "out_of_stock_items": 1,
    "sold_products": {
      "1": 15,
      "2": 8,
      "3": 12
    }
  },
  "daily_performance": [
    {
      "date": "2024-01-15",
      "appointments": 5,
      "completed_appointments": 4,
      "reservations": 3,
      "revenue": 675.00
    }
  ]
}
```

### 4. Admin Analytics

**Endpoint:** `GET /api/admin/analytics`

**Description:** Returns comprehensive system-wide analytics including branch performance comparisons, optometrist workload reports, and system statistics.

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Authorization:**
- Admin only

**Response Structure:**
```json
{
  "period": {
    "days": 30,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "branch_performance": [
    {
      "branch_id": 1,
      "branch_name": "Main Branch",
      "appointments": 150,
      "completed_appointments": 140,
      "revenue": 15750.00,
      "unique_patients": 120
    }
  ],
  "optometrist_workload": [
    {
      "optometrist_id": 2,
      "optometrist_name": "Dr. Smith",
      "branch": "Main Branch",
      "appointments": 120,
      "prescriptions_issued": 95,
      "unique_patients": 80
    }
  ],
  "staff_activity": [
    {
      "staff_id": 3,
      "staff_name": "Jane Staff",
      "branch": "Main Branch",
      "appointments_managed": 150,
      "reservations_processed": 75,
      "revenue_generated": 15750.00
    }
  ],
  "system_wide_stats": {
    "appointments": 300,
    "reservations": 150,
    "revenue": 45000.00,
    "products": 25,
    "branches": 3,
    "users": 50
  },
  "common_diagnoses": {
    "by_type": {
      "myopia": 45,
      "hyperopia": 30,
      "astigmatism": 25
    },
    "by_lens_type": {
      "single_vision": 60,
      "progressive": 25,
      "bifocal": 15
    },
    "by_coating": {
      "anti_reflective": 40,
      "blue_light": 30,
      "uv_protection": 20
    }
  }
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Customer not found"
}
```

### 422 Validation Error
```json
{
  "message": "Validation failed",
  "errors": {
    "field_name": ["The field name is required."]
  }
}
```

## Usage Examples

### Testing with cURL

```bash
# Customer Analytics
curl -H "Authorization: Bearer your_token" \
     -H "Accept: application/json" \
     http://localhost:8000/api/customers/1/analytics

# Optometrist Analytics with 7-day period
curl -H "Authorization: Bearer your_token" \
     -H "Accept: application/json" \
     http://localhost:8000/api/optometrists/2/analytics?period=7

# Staff Analytics
curl -H "Authorization: Bearer your_token" \
     -H "Accept: application/json" \
     http://localhost:8000/api/staff/3/analytics

# Admin Analytics
curl -H "Authorization: Bearer your_token" \
     -H "Accept: application/json" \
     http://localhost:8000/api/admin/analytics
```

### Testing with JavaScript

```javascript
const baseUrl = 'http://localhost:8000/api';
const token = 'your_bearer_token';

// Customer Analytics
fetch(`${baseUrl}/customers/1/analytics`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Customer Analytics:', data));

// Admin Analytics with 90-day period
fetch(`${baseUrl}/admin/analytics?period=90`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Admin Analytics:', data));
```

## Testing

Use the provided test files to verify the endpoints:

1. **PHP Test Script:** `backend/test_analytics_endpoints.php`
2. **HTML Test Page:** `test_analytics_dashboard.html`

### Running the PHP Test

```bash
cd backend
php test_analytics_endpoints.php
```

### Using the HTML Test Page

1. Open `test_analytics_dashboard.html` in a web browser
2. Enter your authentication token
3. Set the appropriate user IDs for testing
4. Click the test buttons for each endpoint

## Data Privacy and Security

- All endpoints implement proper role-based access control
- Customer data is only accessible to authorized personnel
- Sensitive information is properly filtered in responses
- All requests are logged for audit purposes

## Performance Considerations

- Analytics queries are optimized for performance
- Large datasets are paginated where appropriate
- Caching is implemented for frequently accessed data
- Database indexes are optimized for analytics queries

## Future Enhancements

- Real-time analytics updates
- Advanced filtering and search capabilities
- Export functionality for reports
- Custom date range selection
- Comparative analytics between periods
- Advanced visualization data structures
