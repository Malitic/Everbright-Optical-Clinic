<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BranchStockController;
use App\Http\Controllers\RestockRequestController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\EnhancedInventoryController;
use App\Http\Controllers\RealtimeController;
use App\Http\Controllers\RoleRequestController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\BranchAnalyticsController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\StaffScheduleController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\FeedbackController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::get('/user', function (Request $request) {
    return $request->user();
});

// Authentication routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/auth/logout', [AuthController::class, 'logout']);

// Image upload route
Route::middleware('auth:sanctum')->post('/upload/image', [ImageUploadController::class, 'upload']);

// New profile route - returns only name and email
Route::middleware('auth:sanctum')->get('/auth/profile', [AuthController::class, 'profile']);

// Get users by role
Route::middleware('auth:sanctum')->get('/users', [AuthController::class, 'getUsersByRole']);

// Admin user management routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/users', [AuthController::class, 'getAllUsers']);
    Route::post('/admin/users', [AuthController::class, 'createUser']);
    Route::put('/admin/users/{targetUser}', [AuthController::class, 'updateUser']);
    Route::delete('/admin/users/{targetUser}', [AuthController::class, 'deleteUser']);
});

// Product routes - public read access, authenticated write access
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show']);

// Public branch routes
Route::get('branches/active', [BranchController::class, 'getActiveBranches']);

// Staff and Admin product management
Route::middleware('auth:sanctum')->group(function () {
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{product}', [ProductController::class, 'update']);
    Route::delete('products/{product}', [ProductController::class, 'destroy']);
    
    // Admin-only routes
    Route::get('admin/products', [ProductController::class, 'adminIndex']);
    Route::put('admin/products/{product}/approve', [ProductController::class, 'approveProduct']);
});

// Reservation routes
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('reservations', ReservationController::class);
    Route::get('reservations/user/{userId}', [ReservationController::class, 'getUserReservations']);
    Route::get('reservations/total-bill', [ReservationController::class, 'getTotalBill']);
    Route::put('reservations/{reservation}/confirm', [ReservationController::class, 'confirmReservation']);
    Route::put('reservations/{reservation}/approve', [ReservationController::class, 'confirmReservation']); // Alias for frontend compatibility
    Route::put('reservations/{reservation}/reject', [ReservationController::class, 'rejectReservation']);
    Route::put('reservations/{reservation}/complete', [ReservationController::class, 'completeReservation']);
});

// Appointment availability routes - public for testing
Route::get('appointments/availability', [App\Http\Controllers\AppointmentAvailabilityController::class, 'getAvailability']);
Route::get('appointments/weekly-schedule', [App\Http\Controllers\AppointmentAvailabilityController::class, 'getWeeklySchedule']);

// Appointment routes - protected by authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('appointments', AppointmentController::class);
    Route::get('appointments/today', [AppointmentController::class, 'getTodayAppointments']);
    Route::get('appointments/available-slots', [AppointmentController::class, 'getAvailableTimeSlots']);
});

// Prescription routes - protected by authentication
Route::middleware('auth:sanctum')->group(function () {
    // Specific routes first (before parameterized routes)
    Route::get('prescriptions/test', [PrescriptionController::class, 'test']);
    Route::get('prescriptions/patient/{patientId}', [PrescriptionController::class, 'getPatientPrescriptions']);
    Route::get('prescriptions/optometrist/{optometristId}', [PrescriptionController::class, 'getOptometristPrescriptions']);
    
    // Main CRUD routes
    Route::get('prescriptions', [PrescriptionController::class, 'index']);
    Route::post('prescriptions', [PrescriptionController::class, 'store']);
    Route::get('prescriptions/{prescription}', [PrescriptionController::class, 'show']);
    Route::put('prescriptions/{prescription}', [PrescriptionController::class, 'update']);
    Route::delete('prescriptions/{prescription}', [PrescriptionController::class, 'destroy']);
});

// Test route
Route::get('test-prescriptions', function () {
    return response()->json(['message' => 'Test route works']);
});

// Test authenticated route
Route::middleware('auth:sanctum')->get('test-auth', function () {
    return response()->json(['message' => 'Authenticated route works', 'user' => auth()->user()->name]);
});

// Test prescriptions route
Route::middleware('auth:sanctum')->get('test-prescriptions-simple', function () {
    $user = auth()->user();
    return response()->json(['message' => 'Prescriptions route works', 'user' => $user ? $user->name : 'No user']);
});

// Test prescriptions with controller


// Debug authentication endpoint
Route::middleware('auth:sanctum')->get('debug-auth', function () {
    $user = auth()->user();
    return response()->json([
        'authenticated' => true,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_role' => $user->role->value,
        'user_email' => $user->email,
        'token_valid' => true,
        'timestamp' => now()->toISOString()
    ]);
});

// Schedule management routes (admin only)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('schedules', App\Http\Controllers\ScheduleController::class);
    Route::get('schedules/branches', [App\Http\Controllers\ScheduleController::class, 'getBranches']);
    Route::get('schedules/employees', [App\Http\Controllers\ScheduleController::class, 'getEmployees']);
    Route::get('schedules/filtered', [App\Http\Controllers\ScheduleController::class, 'getSchedulesWithFilters']);
    Route::put('schedules/doctor/{doctorId}', [App\Http\Controllers\ScheduleController::class, 'updateScheduleDirectly']);
});

// Schedule change request routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('schedule-change-requests', [App\Http\Controllers\ScheduleChangeRequestController::class, 'index']);
    Route::post('schedule-change-requests', [App\Http\Controllers\ScheduleChangeRequestController::class, 'store']);
    Route::get('schedule-change-requests/{id}', [App\Http\Controllers\ScheduleChangeRequestController::class, 'show']);
    Route::put('schedule-change-requests/{id}', [App\Http\Controllers\ScheduleChangeRequestController::class, 'update']);
    Route::get('schedule-change-requests/optometrist/{optometristId}', [App\Http\Controllers\ScheduleChangeRequestController::class, 'getOptometristRequests']);
});

// Public schedule routes (for customers to view doctor schedules)
Route::get('schedules/doctor/{id}', [App\Http\Controllers\ScheduleController::class, 'getDoctorSchedule']);

// Employee management routes
Route::get('employees', function() {
    try {
        $employees = \App\Models\User::whereIn('role', ['optometrist', 'staff'])
            ->where('is_approved', true)
            ->with('branch')
            ->get();
        
        return response()->json([
            'employees' => $employees
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to fetch employees',
            'message' => $e->getMessage()
        ], 500);
    }
});
Route::get('optometrists', function() {
    try {
        $optometrists = \App\Models\User::where('role', 'optometrist')
            ->where('is_approved', true)
            ->select('id', 'name', 'email')
            ->get();
            
        return response()->json([
            'optometrists' => $optometrists
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to fetch optometrists',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Test route
Route::get('test-availability', function() {
    return response()->json(['message' => 'Test route works']);
});

// Debug schedule route
Route::get('debug-schedules', function() {
    try {
        $optometrists = \App\Models\User::where('role', 'optometrist')
            ->where('is_approved', true)
            ->select('id', 'name', 'email')
            ->get();
            
        return response()->json([
            'success' => true,
            'optometrists' => $optometrists,
            'count' => $optometrists->count()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Test authentication route
Route::get('test-auth', function() {
    $user = Auth::user();
    return response()->json([
        'authenticated' => !!$user,
        'user' => $user ? [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->value ?? 'no role'
        ] : null
    ]);
})->middleware('auth:sanctum');

// Test availability route
Route::get('test-appointment-availability', function(Request $request) {
    try {
        $date = $request->get('date', '2025-10-01');
        $dayOfWeek = \Carbon\Carbon::parse($date)->dayOfWeekIso;
        
        $schedules = \App\Models\Schedule::with(['optometrist', 'branch'])
            ->where('is_active', true)
            ->where('day_of_week', $dayOfWeek)
            ->get();
            
        return response()->json([
            'date' => $date,
            'day_of_week' => $dayOfWeek,
            'schedules_count' => $schedules->count(),
            'schedules' => $schedules->map(function($schedule) {
                return [
                    'optometrist' => $schedule->optometrist->name,
                    'branch' => $schedule->branch->name,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                ];
            })
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});


// Simple availability route - always returns available
Route::get('appointments/availability-simple', function(Request $request) {
    return response()->json([
        'date' => $request->get('date', '2025-10-01'),
        'available' => true,
        'branch' => [
            'id' => 2,
            'name' => 'Unitop Branch',
            'code' => 'UNITOP',
        ],
        'optometrist' => [
            'id' => 25,
            'name' => 'Samuel Loreto Prieto',
        ],
        'available_times' => ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        'services' => ['Eye Exam', 'Follow-up Checkup', 'Prescription Update']
    ]);
});

// Simple appointment booking route
Route::post('appointments/simple', function(Request $request) {
    try {
        $data = $request->all();
        
        // Basic validation
        if (empty($data['patient_id']) || empty($data['optometrist_id']) || empty($data['branch_id']) || 
            empty($data['appointment_date']) || empty($data['start_time']) || empty($data['type'])) {
            return response()->json(['error' => 'Missing required fields'], 400);
        }
        
        // Create appointment record (simplified)
        $appointment = [
            'id' => rand(1000, 9999),
            'patient_id' => $data['patient_id'],
            'optometrist_id' => $data['optometrist_id'],
            'branch_id' => $data['branch_id'],
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'type' => $data['type'],
            'status' => 'scheduled',
            'notes' => $data['notes'] ?? '',
            'created_at' => now()->toISOString(),
        ];
        
        return response()->json([
            'message' => 'Appointment booked successfully',
            'appointment' => $appointment
        ], 201);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to book appointment',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Schedule routes
Route::get('schedules/doctor/{id}', [App\Http\Controllers\ScheduleController::class, 'getDoctorSchedule']);
Route::get('schedules', [App\Http\Controllers\ScheduleController::class, 'getAllSchedules']);

// Prescription routes are already defined above with proper authentication

// Reports routes (Admin only)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/reports/stats', [ReportsController::class, 'getSystemStats']);
    Route::get('/admin/reports/reservations', [ReportsController::class, 'getReservationLogs']);
    Route::get('/admin/reports/users', [ReportsController::class, 'getUserActivityLogs']);
    Route::get('/admin/reports/revenue', [ReportsController::class, 'getRevenueReports']);
    Route::get('/admin/reports/appointments', [ReportsController::class, 'getAppointmentLogs']);
});

// Branch management routes (Admin only)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('branches', [BranchController::class, 'index']);
    Route::post('branches', [BranchController::class, 'store']);
    Route::get('branches/{branch}', [BranchController::class, 'show']);
    Route::put('branches/{branch}', [BranchController::class, 'update']);
    Route::delete('branches/{branch}', [BranchController::class, 'destroy']);
    
    // Branch stock management
    Route::get('branch-stock', [BranchStockController::class, 'index']);
    Route::get('branches/{branch}/stock', [BranchStockController::class, 'getBranchStock']);
    Route::put('products/{product}/branches/{branch}/stock', [BranchStockController::class, 'updateStock']);
    Route::post('products/{product}/branch-stock', [BranchStockController::class, 'setProductStockForAllBranches']);
    Route::get('branch-stock/low-stock', [BranchStockController::class, 'getLowStockAlerts']);
});

// Restock request routes
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('restock-requests', RestockRequestController::class);
    Route::put('restock-requests/{restockRequest}/approve', [RestockRequestController::class, 'approve']);
    Route::put('restock-requests/{restockRequest}/reject', [RestockRequestController::class, 'reject']);
    Route::put('restock-requests/{restockRequest}/fulfill', [RestockRequestController::class, 'fulfill']);
});

// Patient management routes (Staff and Admin only)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('patients', [PatientController::class, 'index']);
    Route::get('patients/{id}', [PatientController::class, 'show']);
    Route::put('patients/{id}', [PatientController::class, 'update']);
});

// Feedback routes
Route::middleware('auth:sanctum')->group(function () {
    // Customer feedback routes
    Route::post('feedback', [FeedbackController::class, 'store']);
    Route::get('feedback/available-appointments', [FeedbackController::class, 'getAvailableAppointments']);
    Route::get('customers/{id}/feedback', [FeedbackController::class, 'getCustomerFeedback']);
    
    // Admin analytics routes
    Route::get('admin/feedback/analytics', [FeedbackController::class, 'getAnalytics']);
});

// Notification routes
Route::middleware('auth:sanctum')->group(function () {
    // New notification system routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::put('/notifications/{notificationId}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications', [NotificationController::class, 'create']);
    
    // Legacy email notification routes
    Route::post('/notifications/send-appointment-reminders', [NotificationController::class, 'sendAppointmentReminders']);
    Route::post('/notifications/send-prescription-expiry', [NotificationController::class, 'sendPrescriptionExpiryNotifications']);
    Route::post('/notifications/send-low-stock', [NotificationController::class, 'sendLowStockNotifications']);
    Route::post('/notifications/send-custom', [NotificationController::class, 'sendCustomNotification']);
    Route::get('/notifications/history', [NotificationController::class, 'getNotificationHistory']);
});

// Enhanced Inventory routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/inventory/enhanced', [EnhancedInventoryController::class, 'getEnhancedInventory']);
    Route::get('/inventory/expiring', [EnhancedInventoryController::class, 'getExpiringProducts']);
    Route::get('/inventory/low-stock-alerts', [EnhancedInventoryController::class, 'getLowStockAlerts']);
    Route::post('/inventory/auto-restock', [EnhancedInventoryController::class, 'processAutoRestock']);
    Route::put('/inventory/products/{product}/settings', [EnhancedInventoryController::class, 'updateProductSettings']);
    Route::get('/inventory/analytics', [EnhancedInventoryController::class, 'getInventoryAnalytics']);
});

// Stock Transfer routes
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('stock-transfers', StockTransferController::class);
    Route::put('stock-transfers/{stockTransfer}/approve', [StockTransferController::class, 'approve']);
    Route::put('stock-transfers/{stockTransfer}/reject', [StockTransferController::class, 'reject']);
    Route::put('stock-transfers/{stockTransfer}/complete', [StockTransferController::class, 'complete']);
    Route::put('stock-transfers/{stockTransfer}/cancel', [StockTransferController::class, 'cancel']);
});

// Realtime SSE stream (handles auth manually via token parameter)
Route::get('/realtime/stream', [RealtimeController::class, 'stream']);

// Role request routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/role-requests', [RoleRequestController::class, 'store']);
    Route::get('/admin/role-requests', [RoleRequestController::class, 'index']);
    Route::put('/admin/role-requests/{roleRequest}/approve', [RoleRequestController::class, 'approve']);
    Route::put('/admin/role-requests/{roleRequest}/reject', [RoleRequestController::class, 'reject']);
});

// Public route to check role request status by email
Route::get('/role-requests/status/{email}', [RoleRequestController::class, 'checkStatus']);

// Public routes
Route::get('products/{product}/availability', [BranchStockController::class, 'getProductAvailability']);

// Branch Analytics routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('analytics/branch-performance', [BranchAnalyticsController::class, 'getBranchPerformance']);
    Route::get('analytics/branches/{branch}', [BranchAnalyticsController::class, 'getBranchAnalytics']);
    Route::get('analytics/product-availability', [BranchAnalyticsController::class, 'getProductAvailability']);
});

// PDF generation and downloads
Route::middleware('auth:sanctum')->group(function () {
    Route::get('pdf/receipts/customer', [PdfController::class, 'getCustomerReceipts']);
    Route::get('pdf/prescriptions/customer', [PdfController::class, 'getCustomerPrescriptions']);
    Route::get('pdf/receipts/{appointmentId}', [PdfController::class, 'downloadReceipt']);
    Route::get('pdf/prescriptions/{prescriptionId}', [PdfController::class, 'downloadPrescription']);
});

// Role-based Analytics routes
Route::middleware('auth:sanctum')->group(function () {
    // Customer analytics
    Route::get('customers/{id}/analytics', [AnalyticsController::class, 'getCustomerAnalytics']);
    
    // Optometrist analytics
    Route::get('optometrists/{id}/analytics', [AnalyticsController::class, 'getOptometristAnalytics']);
    
    // Staff analytics
    Route::get('staff/{id}/analytics', [AnalyticsController::class, 'getStaffAnalytics']);
    
    // Admin analytics
    Route::get('admin/analytics', [AnalyticsController::class, 'getAdminAnalytics']);
});

    // Staff Scheduling routes
    Route::middleware('auth:sanctum')->group(function () {
        // Get staff schedules
        Route::get('staff-schedules/all', [StaffScheduleController::class, 'getAllStaffSchedules']);
        Route::get('staff-schedules/branch/{branchId}', [StaffScheduleController::class, 'getBranchStaffSchedules']);
        Route::get('staff-schedules/staff/{staffId}', [StaffScheduleController::class, 'getStaffSchedule']);
        Route::get('staff-schedules/staff-members', [StaffScheduleController::class, 'getStaffMembers']);
        Route::get('staff-schedules/branches', [StaffScheduleController::class, 'getBranches']);
    
    // Admin-only schedule management
    Route::post('staff-schedules', [StaffScheduleController::class, 'createOrUpdateSchedule']);
    Route::delete('staff-schedules/{scheduleId}', [StaffScheduleController::class, 'deleteSchedule']);
    
    // Schedule change requests
    Route::get('staff-schedules/change-requests', [StaffScheduleController::class, 'getChangeRequests']);
    Route::post('staff-schedules/change-requests', [StaffScheduleController::class, 'createChangeRequest']);
    Route::put('staff-schedules/change-requests/{requestId}/approve', [StaffScheduleController::class, 'approveChangeRequest']);
    Route::put('staff-schedules/change-requests/{requestId}/reject', [StaffScheduleController::class, 'rejectChangeRequest']);
});

// Test PDF generation (for development)
Route::get('pdf/test-receipt', function() {
    $data = [
        'invoice_no' => '0601',
        'date' => date('Y-m-d'),
        'sales_type' => 'cash',
        'customer_name' => 'John Doe',
        'tin' => '123-456-789-000',
        'address' => '123 Main Street, City, Province',
        'items' => [
            [
                'description' => 'Eye Examination',
                'qty' => 1,
                'unit_price' => 500.00,
                'amount' => 500.00
            ],
            [
                'description' => 'Prescription Lenses',
                'qty' => 1,
                'unit_price' => 300.00,
                'amount' => 300.00
            ]
        ],
        'total_sales' => 800.00,
        'vatable_sales' => 714.29,
        'less_vat' => 85.71,
        'add_vat' => 85.71,
        'zero_rated_sales' => 0.00,
        'net_of_vat' => 714.29,
        'vat_exempt_sales' => 0.00,
        'discount' => 0.00,
        'withholding_tax' => 0.00,
        'total_due' => 800.00
    ];

    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.receipt', $data);
    return $pdf->download('test_receipt.pdf');
});

// Test PDF generation with actual appointment data (for development)
Route::get('pdf/test-receipt/{appointmentId}', function($appointmentId) {
    try {
        $appointment = \App\Models\Appointment::with(['patient', 'optometrist', 'branch'])->findOrFail($appointmentId);
        
        $invoiceNumber = str_pad($appointment->id, 4, '0', STR_PAD_LEFT);
        $baseAmount = 500.00;
        $vatRate = 0.12;
        $vatableAmount = $baseAmount / (1 + $vatRate);
        $vatAmount = $baseAmount - $vatableAmount;
        
        $data = [
            'invoice_no' => $invoiceNumber,
            'date' => $appointment->appointment_date->format('Y-m-d'),
            'sales_type' => 'cash',
            'customer_name' => $appointment->patient->name,
            'tin' => 'N/A',
            'address' => $appointment->patient->address ?? 'N/A',
            'items' => [
                [
                    'description' => 'Eye Examination',
                    'qty' => 1,
                    'unit_price' => $baseAmount,
                    'amount' => $baseAmount
                ]
            ],
            'total_sales' => $baseAmount,
            'vatable_sales' => $vatableAmount,
            'less_vat' => $vatAmount,
            'add_vat' => $vatAmount,
            'zero_rated_sales' => 0.00,
            'net_of_vat' => $vatableAmount,
            'vat_exempt_sales' => 0.00,
            'discount' => 0.00,
            'withholding_tax' => 0.00,
            'total_due' => $baseAmount
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.receipt', $data);
        return $pdf->download('receipt_' . $invoiceNumber . '.pdf');
        
    } catch (\Exception $e) {
        return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
    }
});
