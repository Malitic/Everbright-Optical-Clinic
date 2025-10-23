<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\EyewearReminderController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\OptometristController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\StaffScheduleController;
use App\Http\Controllers\RestockRequestController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\BranchStockController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\EnhancedInventoryController;
use App\Http\Controllers\RealTimeInventoryController;
use App\Http\Controllers\CrossBranchInventoryController;
use App\Http\Controllers\BranchContactController;
use App\Http\Controllers\GlassOrderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route to verify inventory data
// Health check endpoint for Railway
Route::get('/health', function() {
    return response()->json([
        'status' => 'healthy',
        'service' => 'Everbright Optical System',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});

// Database connection test endpoint
Route::get('/db-test', function() {
    try {
        $pdo = DB::connection()->getPdo();
        $databaseName = DB::connection()->getDatabaseName();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Database connected successfully',
            'database' => $databaseName,
            'driver' => DB::connection()->getDriverName(),
            'timestamp' => now()->toISOString()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Database connection failed',
            'error' => $e->getMessage(),
            'timestamp' => now()->toISOString()
        ], 500);
    }
});

// Test route for contact API (public access)
Route::get('/test-contact', function() {
    return response()->json([
        'message' => 'Contact API is working',
        'timestamp' => now(),
        'user' => auth()->user() ? auth()->user()->name : 'Not authenticated'
    ]);
});

// Test login endpoint (bypass middleware)
Route::post('/test-login', function(Request $request) {
    $email = $request->email;
    $password = $request->password;
    $role = $request->role;
    
    // Find user
    $user = \App\Models\User::where('email', $email)->first();
    
    if (!$user) {
        return response()->json(['error' => 'User not found', 'email' => $email]);
    }
    
    // Check password
    if (!\Illuminate\Support\Facades\Hash::check($password, $user->password)) {
        return response()->json(['error' => 'Invalid password', 'email' => $email]);
    }
    
    // Check approval
    if (!$user->is_approved) {
        return response()->json(['error' => 'Account not approved', 'email' => $email]);
    }
    
    // Check role
    $userRoleValue = $user->role->value ?? (string)$user->role;
    if ($role !== $userRoleValue) {
        return response()->json(['error' => 'Role mismatch', 'requested' => $role, 'actual' => $userRoleValue]);
    }
    
    // Create token
    $user->tokens()->delete(); // Delete old tokens
    $token = $user->createToken('auth_token', ['*'])->plainTextToken;
    
    return response()->json([
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $userRoleValue,
            'is_approved' => $user->is_approved
        ]
    ]);
});

// Simple login test without validation
Route::post('/simple-login', function(Request $request) {
    $email = $request->email;
    $password = $request->password;
    
    $user = \App\Models\User::where('email', $email)->first();
    
    if (!$user || !\Illuminate\Support\Facades\Hash::check($password, $user->password)) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
    
    $token = $user->createToken('auth_token')->plainTextToken;
    
    return response()->json([
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value ?? (string)$user->role
        ]
    ]);
});

Route::get('/test-unitop-inventory', function() {
    $branchStocks = \App\Models\BranchStock::with(['product', 'branch'])
        ->get();
    
    $lowStock = $branchStocks->filter(function($item) {
        return ($item->stock_quantity - $item->reserved_quantity) <= ($item->min_stock_threshold ?? 5);
    });
    
    return response()->json([
        'total_items' => $branchStocks->count(),
        'low_stock_count' => $lowStock->count(),
        'items' => $branchStocks->map(function($item) {
            $available = $item->stock_quantity - $item->reserved_quantity;
            $threshold = $item->min_stock_threshold ?? 5;
            return [
                'id' => $item->id,
                'product' => $item->product->name,
                'stock' => $item->stock_quantity,
                'reserved' => $item->reserved_quantity,
                'available' => $available,
                'threshold' => $threshold,
                'is_low_stock' => $available <= $threshold,
                'status' => $item->status
            ];
        })
    ]);
});

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/branches/active', [BranchController::class, 'getActiveBranches']); // Public - for customers
Route::get('/optometrists', [OptometristController::class, 'index']); // Public - for scheduling
Route::get('/appointments/availability', [App\Http\Controllers\AppointmentAvailabilityController::class, 'getAvailability']); // Public - for scheduling

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Branch routes (Admin only)
    Route::get('/branches', [BranchController::class, 'index']); // Moved inside auth
    Route::post('/branches', [BranchController::class, 'store']);
    Route::get('/branches/{branch}', [BranchController::class, 'show']);
    Route::put('/branches/{branch}', [BranchController::class, 'update']);
    Route::delete('/branches/{branch}', [BranchController::class, 'destroy']);

    // Enhanced Inventory Routes
    Route::get('/inventory/enhanced', [EnhancedInventoryController::class, 'index']);
    Route::post('/enhanced-inventory', [EnhancedInventoryController::class, 'store']);
    Route::put('/enhanced-inventory/{id}', [EnhancedInventoryController::class, 'update']);
    Route::delete('/enhanced-inventory/{id}', [EnhancedInventoryController::class, 'destroy']);
    Route::get('/inventory/branch/{branch}', [EnhancedInventoryController::class, 'getBranchInventory']);
    Route::get('/inventory/low-stock-alerts', [EnhancedInventoryController::class, 'getLowStockAlerts']);

    // General analytics routes (accessible by authenticated users)
    Route::get('/analytics/realtime', [AnalyticsController::class, 'getRealTimeAnalytics']);
    Route::get('/analytics/trends', [AnalyticsController::class, 'getAnalyticsTrends']);
    Route::post('/inventory/send-low-stock-alert', [EnhancedInventoryController::class, 'sendLowStockAlert']);
    
    // Realtime stream endpoint for Server-Sent Events
    Route::get('/realtime/stream', function(Request $request) {
        return response()->stream(function() {
            echo "data: " . json_encode(['type' => 'connected', 'timestamp' => now()]) . "\n\n";
            
            // Keep connection alive for 30 seconds
            $endTime = time() + 30;
            while (time() < $endTime) {
                echo "data: " . json_encode(['type' => 'heartbeat', 'timestamp' => now()]) . "\n\n";
                ob_flush();
                flush();
                sleep(5);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Headers' => 'Cache-Control',
        ]);
    });

    // Branch Stock Routes
    Route::get('/branch-stock', [BranchStockController::class, 'index']);
    Route::post('/branch-stock', [BranchStockController::class, 'store']);
    Route::put('/branch-stock/{branchStock}', [BranchStockController::class, 'update']);
    Route::delete('/branch-stock/{branchStock}', [BranchStockController::class, 'destroy']);
    Route::get('/branch-stock/product/{productId}', [BranchStockController::class, 'getByProduct']);
    Route::get('/branch-stock/branch/{branchId}', [BranchStockController::class, 'getByBranch']);
    
    // Product stock by branch - specific endpoint for frontend calls
    Route::get('/products/{product}/branches/{branch}/stock', [BranchStockController::class, 'getProductBranchStock']);
    Route::put('/products/{product}/branches/{branch}/stock', [BranchStockController::class, 'updateStock']);

    // Cross-branch availability
    Route::get('/inventory/cross-branch-availability', [CrossBranchInventoryController::class, 'getCrossBranchAvailability']);

    // Stock transfers
    Route::post('/inventory/stock-transfer-request', [CrossBranchInventoryController::class, 'requestStockTransfer']);
    Route::get('/inventory/stock-transfers', [CrossBranchInventoryController::class, 'getStockTransferHistory']);

    // Real-time inventory routes
    Route::get('/inventory/realtime', [RealTimeInventoryController::class, 'getRealTimeInventory']);
    Route::post('/inventory/realtime/update', [RealTimeInventoryController::class, 'updateInventory']);
    Route::get('/inventory/realtime/alerts', [RealTimeInventoryController::class, 'getInventoryAlerts']);

    // Product routes
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::get('/products/search/{query}', [ProductController::class, 'search']);

    // Product categories
    Route::get('/product-categories', [ProductCategoryController::class, 'index']);
    Route::post('/product-categories', [ProductCategoryController::class, 'store']);
    Route::get('/product-categories/{category}', [ProductCategoryController::class, 'show']);
    Route::put('/product-categories/{category}', [ProductCategoryController::class, 'update']);
    Route::delete('/product-categories/{category}', [ProductCategoryController::class, 'destroy']);

    // Appointment routes
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);
    Route::get('/appointments/patient/{patientId}', [AppointmentController::class, 'getByPatient']);
    Route::get('/appointments/optometrist/{optometristId}', [AppointmentController::class, 'getByOptometrist']);
    Route::get('/appointments/branch/{branchId}', [AppointmentController::class, 'getByBranch']);
    Route::post('/appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('/appointments/{appointment}/complete', [AppointmentController::class, 'complete']);

    // Prescription routes
    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{prescription}', [PrescriptionController::class, 'show']);
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update']);
    Route::delete('/prescriptions/{prescription}', [PrescriptionController::class, 'destroy']);
    Route::get('/prescriptions/patient/{patientId}', [PrescriptionController::class, 'getByPatient']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/eyewear-condition', [NotificationController::class, 'sendEyewearConditionNotification']);

    // Eyewear reminder routes
    Route::get('/eyewear/reminders', [EyewearReminderController::class, 'getReminders']);
    Route::post('/eyewear/{id}/condition-form', [EyewearReminderController::class, 'submitConditionForm']);
    Route::post('/eyewear/{id}/set-appointment', [EyewearReminderController::class, 'setAppointment']);

    // Branch contact routes
    Route::get('/branch-contacts', [BranchContactController::class, 'index']);
    Route::get('/branch-contacts/{branchId}', [BranchContactController::class, 'show']);

    // Glass order routes
    Route::get('/glass-orders', [GlassOrderController::class, 'index']);
    Route::post('/glass-orders', [GlassOrderController::class, 'store']);
    Route::get('/glass-orders/{id}', [GlassOrderController::class, 'show']);
    Route::put('/glass-orders/{id}', [GlassOrderController::class, 'update']);
    Route::get('/glass-orders/patient/{patientId}', [GlassOrderController::class, 'getByPatient']);
    Route::post('/glass-orders/{id}/send-to-manufacturer', [GlassOrderController::class, 'markAsSentToManufacturer']);

    // Report routes
    Route::get('/reports/analytics/pdf', [App\Http\Controllers\ReportController::class, 'generateAnalyticsReport']);
    Route::get('/branch-contacts/my-branch', [BranchContactController::class, 'getMyBranchContact']);
    Route::post('/branch-contacts', [BranchContactController::class, 'store']);
    Route::put('/branch-contacts/{id}', [BranchContactController::class, 'update']);
    Route::delete('/branch-contacts/{id}', [BranchContactController::class, 'destroy']);

    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::get('/schedules/doctor/{doctorId}', [ScheduleController::class, 'getDoctorSchedule']);
    Route::get('/schedules/weekly', [ScheduleController::class, 'getWeeklySchedule']);

    Route::get('/patients', [PatientController::class, 'index']);

    Route::post('/upload/image', [ImageUploadController::class, 'uploadImage']);
    Route::post('/upload/images', [ImageUploadController::class, 'uploadMultiple']);
    // Intelligent bulk upload from ZIP (AI analyzer)
    Route::post('/intelligent-bulk-upload', [\App\Http\Controllers\IntelligentBulkUploadController::class, 'upload']);

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/patients', [TransactionController::class, 'getPatientTransactions']);

    Route::get('/receipts', [ReceiptController::class, 'index']);
    Route::post('/receipts', [ReceiptController::class, 'store']);
    Route::get('/receipts/{receipt}', [ReceiptController::class, 'show']);
    Route::get('/receipts/{receipt}/download', [ReceiptController::class, 'downloadReceipt']);
    Route::get('/customers/{customerId}/receipts', [ReceiptController::class, 'getByCustomer']);

    // Feedback routes
    Route::get('/feedback', [FeedbackController::class, 'index']);
    Route::post('/feedback', [FeedbackController::class, 'store']);
    Route::get('/feedback/available-appointments', [FeedbackController::class, 'getAvailableAppointments']);
    Route::get('/admin/feedback/analytics', [FeedbackController::class, 'getAnalytics']);
    Route::get('/feedback/{feedback}', [FeedbackController::class, 'show']);
    Route::put('/feedback/{feedback}', [FeedbackController::class, 'update']);
    Route::delete('/feedback/{feedback}', [FeedbackController::class, 'destroy']);
    Route::get('/customers/{customerId}/feedback', [FeedbackController::class, 'getByCustomer']);

    // Staff schedule routes
    Route::get('/staff-schedules', [StaffScheduleController::class, 'index']);
    Route::post('/staff-schedules', [StaffScheduleController::class, 'store']);
    Route::get('/staff-schedules/{schedule}', [StaffScheduleController::class, 'show']);
    Route::put('/staff-schedules/{schedule}', [StaffScheduleController::class, 'update']);
    Route::delete('/staff-schedules/{schedule}', [StaffScheduleController::class, 'destroy']);

    // Restock request routes
    Route::get('/restock-requests', [RestockRequestController::class, 'index']);
    Route::post('/restock-requests', [RestockRequestController::class, 'store']);
    Route::get('/restock-requests/{request}', [RestockRequestController::class, 'show']);
    Route::put('/restock-requests/{request}', [RestockRequestController::class, 'update']);
    Route::delete('/restock-requests/{request}', [RestockRequestController::class, 'destroy']);

    // Reservation routes
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
    Route::put('/reservations/{reservation}', [ReservationController::class, 'update']);
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);
    Route::put('/reservations/{reservation}/approve', [ReservationController::class, 'approve']);
    Route::put('/reservations/{reservation}/reject', [ReservationController::class, 'reject']);

    // Admin user management routes
    Route::post('/admin/users', [AuthController::class, 'createUser']);
    Route::get('/admin/users', [AuthController::class, 'getAllUsers']);
    Route::put('/admin/users/{id}', [AuthController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AuthController::class, 'deleteUser']);
    Route::post('/admin/users/{id}/approve', [AuthController::class, 'approveUser']);
    Route::post('/admin/users/{id}/reject', [AuthController::class, 'rejectUser']);

});