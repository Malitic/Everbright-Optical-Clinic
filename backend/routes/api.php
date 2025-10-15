<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
// use App\Http\Controllers\UserController; // Controller doesn't exist
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PrescriptionController;
// use App\Http\Controllers\InventoryController; // Controller does not exist
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\OptometristController;
use App\Http\Controllers\ProductController;
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
// use App\Http\Controllers\AdminProductController; // Controller does not exist

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route to verify inventory data
Route::get('/test-unitop-inventory', function() {
    $branchStocks = \App\Models\BranchStock::where('branch_id', 2)
        ->with(['product', 'branch'])
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

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Branch routes (Admin only)
    Route::get('/branches', [BranchController::class, 'index']); // Moved inside auth

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

    // Branch Stock Routes
    Route::get('/branch-stock', [BranchStockController::class, 'index']);
    Route::post('/branch-stock', [BranchStockController::class, 'store']);
    Route::put('/branch-stock/{branchStock}', [BranchStockController::class, 'update']);
    Route::delete('/branch-stock/{branchStock}', [BranchStockController::class, 'destroy']);
    Route::get('/branch-stock/product/{productId}', [BranchStockController::class, 'getByProduct']);
    Route::get('/branch-stock/branch/{branchId}', [BranchStockController::class, 'getByBranch']);

    // Manufacturers
    Route::get('/manufacturers-directory', function() {
        return response()->json([
            'manufacturers' => \App\Models\Manufacturer::all()
        ]);
    });

    // Admin routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // User management routes
        Route::get('/users', [AuthController::class, 'getAllUsers']);
        Route::post('/users', [AuthController::class, 'createUser']);
        Route::get('/users/{id}', [AuthController::class, 'getUserById']);
        Route::put('/users/{id}', [AuthController::class, 'updateUser']);
        Route::delete('/users/{id}', [AuthController::class, 'deleteUser']);
        Route::post('/users/{id}/approve', [AuthController::class, 'approveUser']);
        Route::post('/users/{id}/reject', [AuthController::class, 'rejectUser']);
        
        // Product management - Routes commented out due to missing AdminProductController
        // Route::get('/products', [AdminProductController::class, 'index']);
        // Route::post('/products/{product}/approve', [AdminProductController::class, 'approve']);
        // Route::post('/products/{product}/reject', [AdminProductController::class, 'reject']);
        
        Route::get('/analytics/dashboard', [AnalyticsController::class, 'getDashboardStats']);
        Route::get('/analytics/branch-performance', [AnalyticsController::class, 'getBranchPerformance']);
        
        // Additional analytics routes
        Route::get('/analytics', [AnalyticsController::class, 'getAdminAnalytics']);
        Route::get('/analytics/realtime', [AnalyticsController::class, 'getRealTimeAnalytics']);
        Route::get('/analytics/trends', [AnalyticsController::class, 'getAnalyticsTrends']);
        Route::get('/customers/{id}/analytics', [AnalyticsController::class, 'getCustomerAnalytics']);
        Route::get('/optometrists/{id}/analytics', [AnalyticsController::class, 'getOptometristAnalytics']);
        
            // Feedback analytics
            Route::get('/feedback/analytics', [FeedbackController::class, 'getAnalytics']);
            
            // Product analytics
            Route::get('/products/analytics', [App\Http\Controllers\ProductAnalyticsController::class, 'getTopSellingProducts']);
            Route::get('/products/category-analytics', [App\Http\Controllers\ProductAnalyticsController::class, 'getCategoryAnalytics']);
            Route::get('/products/low-performing', [App\Http\Controllers\ProductAnalyticsController::class, 'getLowPerformingProducts']);
            
            // Revenue analytics
            Route::get('/revenue/monthly-comparison', [App\Http\Controllers\RevenueAnalyticsController::class, 'getMonthlyComparison']);
            Route::get('/revenue/by-service', [App\Http\Controllers\RevenueAnalyticsController::class, 'getRevenueByService']);
    });

    // Optometrist routes
    Route::middleware('role:optometrist')->prefix('optometrist')->group(function () {
        Route::get('/appointments', [AppointmentController::class, 'getOptometristAppointments']);
        Route::get('/appointments/today', [OptometristController::class, 'getTodayAppointments']);
        Route::put('/appointments/{appointment}/complete', [AppointmentController::class, 'completeAppointment']);
        Route::get('/patients', [OptometristController::class, 'getPatients']);
        Route::get('/patients/{patient}', [OptometristController::class, 'getPatient']);
        Route::get('/prescriptions', [OptometristController::class, 'getPrescriptions']);
    });

    // Staff routes
    Route::middleware('role:staff')->prefix('staff')->group(function () {
        Route::get('/appointments', [AppointmentController::class, 'getStaffAppointments']);
        Route::post('/restock-requests', [RestockRequestController::class, 'store']);
        Route::get('/reservations', [ReservationController::class, 'getStaffReservations']);
        
        // Staff products
        // Routes commented out due to missing AdminProductController
        // Route::get('/products', [AdminProductController::class, 'getStaffProducts']);
        // Route::post('/products', [AdminProductController::class, 'storeStaffProduct']);
        
        // Staff analytics
        Route::get('/analytics', [AnalyticsController::class, 'getStaffAnalytics']);
    });

    // Customer routes
    Route::middleware('role:customer')->prefix('customer')->group(function () {
        Route::post('/reservations', [ReservationController::class, 'store']);
        Route::get('/reservations', [ReservationController::class, 'getCustomerReservations']);
    });

    // Shared routes (multiple roles)
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);

    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{prescription}', [PrescriptionController::class, 'show']);
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{product}/toggle-status', [ProductController::class, 'toggleStatus']);

    // Routes commented out due to missing InventoryController
    // Route::get('/inventory', [InventoryController::class, 'index']);
    // Route::post('/inventory', [InventoryController::class, 'store']);
    // Route::get('/inventory/{inventory}', [InventoryController::class, 'show']);
    // Route::put('/inventory/{inventory}', [InventoryController::class, 'update']);
    // Route::delete('/inventory/{inventory}', [InventoryController::class, 'destroy']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::get('/schedules/doctor/{doctorId}', [ScheduleController::class, 'getDoctorSchedule']);
    Route::get('/schedules/weekly', [ScheduleController::class, 'getWeeklySchedule']);

    Route::get('/optometrists', [OptometristController::class, 'index']);
    Route::get('/patients', [PatientController::class, 'index']);

    Route::post('/upload/image', [ImageUploadController::class, 'uploadImage']);
    Route::post('/upload/images', [ImageUploadController::class, 'uploadMultiple']);

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);

    Route::get('/receipts', [ReceiptController::class, 'index']);
    Route::post('/receipts', [ReceiptController::class, 'store']);
    Route::get('/receipts/{receipt}', [ReceiptController::class, 'show']);

    Route::post('/feedback', [FeedbackController::class, 'store']);
    Route::get('/feedback', [FeedbackController::class, 'index']);

    // Staff Schedule Management
    Route::get('/staff-schedules', [StaffScheduleController::class, 'index']);
    Route::post('/staff-schedules', [StaffScheduleController::class, 'store']);
    Route::put('/staff-schedules/{schedule}', [StaffScheduleController::class, 'update']);
    Route::delete('/staff-schedules/{schedule}', [StaffScheduleController::class, 'destroy']);
    Route::get('/staff-schedules/weekly', [StaffScheduleController::class, 'getWeeklySchedule']);
    Route::post('/staff-schedules/change-requests', [StaffScheduleController::class, 'createChangeRequest']);
    Route::get('/staff-schedules/change-requests', [StaffScheduleController::class, 'getChangeRequests']);
    Route::put('/staff-schedules/change-requests/{request}', [StaffScheduleController::class, 'updateChangeRequest']);

    // Reservations
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
    Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
    Route::post('/reservations/{reservation}/complete', [ReservationController::class, 'complete']);
});
