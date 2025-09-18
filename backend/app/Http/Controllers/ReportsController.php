<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    /**
     * Get system statistics (Admin only)
     */
    public function getSystemStats(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'users' => [
                'total' => User::count(),
                'by_role' => User::select('role', DB::raw('count(*) as count'))
                    ->groupBy('role')
                    ->get()
                    ->pluck('count', 'role')
                    ->toArray()
            ],
            'products' => [
                'total' => Product::count(),
                'by_category' => Product::select('category', DB::raw('count(*) as count'))
                    ->groupBy('category')
                    ->get()
                    ->pluck('count', 'category')
                    ->toArray()
            ],
            'reservations' => [
                'total' => Reservation::count(),
                'by_status' => Reservation::select('status', DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get()
                    ->pluck('count', 'status')
                    ->toArray(),
                'total_revenue' => Reservation::where('status', 'confirmed')
                    ->join('products', 'reservations.product_id', '=', 'products.id')
                    ->sum('products.price')
            ],
            'appointments' => [
                'total' => Appointment::count(),
                'by_status' => Appointment::select('status', DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get()
                    ->pluck('count', 'status')
                    ->toArray()
            ],
            'prescriptions' => [
                'total' => Prescription::count()
            ]
        ];

        return response()->json([
            'data' => $stats
        ], 200);
    }

    /**
     * Get reservation logs (Admin only)
     */
    public function getReservationLogs(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Reservation::with(['user:id,name,email', 'product:id,name,price'])
            ->select('id', 'user_id', 'product_id', 'status', 'created_at', 'approved_at', 'rejected_at')
            ->orderBy('created_at', 'desc');

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $logs = $query->paginate(50);

        return response()->json([
            'data' => $logs
        ], 200);
    }

    /**
     * Get user activity logs (Admin only)
     */
    public function getUserActivityLogs(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
            ->withCount([
                'reservations',
                'appointments',
                'prescriptions'
            ])
            ->orderBy('created_at', 'desc');

        // Filter by role if provided
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $logs = $query->paginate(50);

        return response()->json([
            'data' => $logs
        ], 200);
    }

    /**
     * Get revenue reports (Admin only)
     */
    public function getRevenueReports(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $revenue = Reservation::where('status', 'confirmed')
            ->whereBetween('approved_at', [$startDate, $endDate])
            ->join('products', 'reservations.product_id', '=', 'products.id')
            ->select(
                DB::raw('DATE(approved_at) as date'),
                DB::raw('SUM(products.price) as daily_revenue'),
                DB::raw('COUNT(*) as reservations_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $totalRevenue = $revenue->sum('daily_revenue');
        $totalReservations = $revenue->sum('reservations_count');

        return response()->json([
            'data' => [
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ],
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'total_reservations' => $totalReservations,
                    'average_revenue_per_reservation' => $totalReservations > 0 ? $totalRevenue / $totalReservations : 0
                ],
                'daily_breakdown' => $revenue
            ]
        ], 200);
    }

    /**
     * Get appointment logs (Admin only)
     */
    public function getAppointmentLogs(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Appointment::with(['user:id,name,email', 'optometrist:id,name,email'])
            ->select('id', 'user_id', 'optometrist_id', 'appointment_date', 'appointment_time', 'status', 'notes', 'created_at', 'updated_at')
            ->orderBy('created_at', 'desc');

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('appointment_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('appointment_date', '<=', $request->end_date);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $logs = $query->paginate(50);

        return response()->json([
            'data' => $logs
        ], 200);
    }
}
