<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ProductController;

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
Route::apiResource('reservations', ReservationController::class);
Route::get('reservations/user/{userId}', [ReservationController::class, 'getUserReservations']);
Route::get('reservations/total-bill', [ReservationController::class, 'getTotalBill']);
Route::put('reservations/{reservation}/confirm', [ReservationController::class, 'confirmReservation']);
Route::put('reservations/{reservation}/reject', [ReservationController::class, 'rejectReservation']);

// Appointment routes
Route::apiResource('appointments', AppointmentController::class);
Route::get('appointments/today', [AppointmentController::class, 'getTodayAppointments']);
Route::get('appointments/available-slots', [AppointmentController::class, 'getAvailableTimeSlots']);

// Prescription routes
Route::apiResource('prescriptions', PrescriptionController::class);
Route::get('prescriptions/patient/{patientId}', [PrescriptionController::class, 'getPatientPrescriptions']);

// Reports routes (Admin only)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/reports/stats', [ReportsController::class, 'getSystemStats']);
    Route::get('/admin/reports/reservations', [ReportsController::class, 'getReservationLogs']);
    Route::get('/admin/reports/users', [ReportsController::class, 'getUserActivityLogs']);
    Route::get('/admin/reports/revenue', [ReportsController::class, 'getRevenueReports']);
    Route::get('/admin/reports/appointments', [ReportsController::class, 'getAppointmentLogs']);
});
