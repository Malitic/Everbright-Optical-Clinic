<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Branch;
use App\Models\Reservation;
use App\Models\BranchStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Enums\UserRole;

class AnalyticsController extends Controller
{
    /**
     * Get customer analytics
     * GET /api/customers/{id}/analytics
     */
    public function getCustomerAnalytics(Request $request, $customerId): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can access this customer's data
        if (!$user || 
            ($user->role->value !== 'admin' && 
             $user->role->value !== 'optometrist' && 
             $user->role->value !== 'staff' && 
             $user->id != $customerId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $customer = User::find($customerId);
        if (!$customer || $customer->role->value !== 'customer') {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        // Get vision history data (SPH, CYL, Axis trends)
        $prescriptions = Prescription::where('patient_id', $customerId)
            ->orderBy('issue_date', 'desc')
            ->get();

        $visionHistory = $prescriptions->map(function ($prescription) {
            $rightEye = $prescription->right_eye ?? [];
            $leftEye = $prescription->left_eye ?? [];
            
            return [
                'date' => $prescription->issue_date->format('Y-m-d'),
                'prescription_number' => $prescription->prescription_number,
                'right_eye' => [
                    'sph' => $rightEye['sph'] ?? null,
                    'cyl' => $rightEye['cyl'] ?? null,
                    'axis' => $rightEye['axis'] ?? null,
                ],
                'left_eye' => [
                    'sph' => $leftEye['sph'] ?? null,
                    'cyl' => $leftEye['cyl'] ?? null,
                    'axis' => $leftEye['axis'] ?? null,
                ],
                'expiry_date' => $prescription->expiry_date->format('Y-m-d'),
                'status' => $prescription->status,
                'is_expired' => $prescription->isExpired(),
            ];
        });

        // Get appointment history
        $appointments = Appointment::where('patient_id', $customerId)
            ->with(['optometrist', 'branch'])
            ->orderBy('appointment_date', 'desc')
            ->get();

        $appointmentHistory = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'date' => $appointment->appointment_date->format('Y-m-d'),
                'time' => $appointment->start_time,
                'type' => $appointment->type,
                'status' => $appointment->status,
                'optometrist' => $appointment->optometrist ? [
                    'name' => $appointment->optometrist->name,
                    'id' => $appointment->optometrist->id,
                ] : null,
                'branch' => $appointment->branch ? [
                    'name' => $appointment->branch->name,
                    'address' => $appointment->branch->address,
                ] : null,
            ];
        });

        // Calculate statistics
        $totalAppointments = $appointments->count();
        $completedAppointments = $appointments->where('status', 'completed')->count();
        $missedAppointments = $appointments->where('status', 'cancelled')->count();
        $upcomingAppointments = $appointments->where('status', 'scheduled')
            ->where('appointment_date', '>=', now())->count();

        $totalPrescriptions = $prescriptions->count();
        $activePrescriptions = $prescriptions->where('status', 'active')->count();
        $expiredPrescriptions = $prescriptions->filter(function ($prescription) {
            return $prescription->isExpired();
        })->count();

        // Vision trends analysis
        $visionTrends = $this->analyzeVisionTrends($prescriptions);

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
            ],
            'vision_history' => $visionHistory,
            'appointment_history' => $appointmentHistory,
            'statistics' => [
                'appointments' => [
                    'total' => $totalAppointments,
                    'completed' => $completedAppointments,
                    'missed' => $missedAppointments,
                    'upcoming' => $upcomingAppointments,
                    'completion_rate' => $totalAppointments > 0 ? round(($completedAppointments / $totalAppointments) * 100, 1) : 0,
                ],
                'prescriptions' => [
                    'total' => $totalPrescriptions,
                    'active' => $activePrescriptions,
                    'expired' => $expiredPrescriptions,
                    'expiry_rate' => $totalPrescriptions > 0 ? round(($expiredPrescriptions / $totalPrescriptions) * 100, 1) : 0,
                ],
            ],
            'vision_trends' => $visionTrends,
        ]);
    }

    /**
     * Get optometrist analytics
     * GET /api/optometrists/{id}/analytics
     */
    public function getOptometristAnalytics(Request $request, $optometristId): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can access this optometrist's data
        if (!$user || 
            ($user->role->value !== 'admin' && 
             $user->role->value !== 'staff' && 
             $user->id != $optometristId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $optometrist = User::find($optometristId);
        if (!$optometrist || $optometrist->role->value !== 'optometrist') {
            return response()->json(['message' => 'Optometrist not found'], 404);
        }

        $period = $request->get('period', '30'); // days
        $startDate = Carbon::now()->subDays($period);

        // Get daily/weekly appointments count
        $appointments = Appointment::where('optometrist_id', $optometristId)
            ->where('appointment_date', '>=', $startDate)
            ->get();

        $dailyAppointments = $appointments->groupBy(function ($appointment) {
            return $appointment->appointment_date->format('Y-m-d');
        })->map(function ($dayAppointments) {
            return [
                'date' => $dayAppointments->first()->appointment_date->format('Y-m-d'),
                'total' => $dayAppointments->count(),
                'completed' => $dayAppointments->where('status', 'completed')->count(),
                'cancelled' => $dayAppointments->where('status', 'cancelled')->count(),
                'scheduled' => $dayAppointments->where('status', 'scheduled')->count(),
            ];
        })->values();

        // Get prescriptions issued per period
        $prescriptions = Prescription::where('optometrist_id', $optometristId)
            ->where('issue_date', '>=', $startDate)
            ->get();

        $prescriptionStats = [
            'total_issued' => $prescriptions->count(),
            'by_type' => $prescriptions->groupBy('type')->map->count(),
            'by_status' => $prescriptions->groupBy('status')->map->count(),
        ];

        // Get follow-up compliance (patients who returned vs missed)
        $followUpCompliance = $this->calculateFollowUpCompliance($optometristId, $startDate);

        // Get workload distribution
        $workloadDistribution = $this->calculateWorkloadDistribution($optometristId, $startDate);

        return response()->json([
            'optometrist' => [
                'id' => $optometrist->id,
                'name' => $optometrist->name,
                'email' => $optometrist->email,
                'branch' => $optometrist->branch ? [
                    'name' => $optometrist->branch->name,
                    'address' => $optometrist->branch->address,
                ] : null,
            ],
            'period' => [
                'days' => $period,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => Carbon::now()->format('Y-m-d'),
            ],
            'appointments' => [
                'daily' => $dailyAppointments,
                'total' => $appointments->count(),
                'completed' => $appointments->where('status', 'completed')->count(),
                'cancelled' => $appointments->where('status', 'cancelled')->count(),
                'scheduled' => $appointments->where('status', 'scheduled')->count(),
            ],
            'prescriptions' => $prescriptionStats,
            'follow_up_compliance' => $followUpCompliance,
            'workload_distribution' => $workloadDistribution,
        ]);
    }

    /**
     * Get staff analytics
     * GET /api/staff/{id}/analytics
     */
    public function getStaffAnalytics(Request $request, $staffId): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can access this staff's data
        if (!$user || 
            ($user->role->value !== 'admin' && $user->id != $staffId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $staff = User::find($staffId);
        if (!$staff || $staff->role->value !== 'staff') {
            return response()->json(['message' => 'Staff not found'], 404);
        }

        if (!$staff->branch_id) {
            return response()->json(['message' => 'Staff member not assigned to a branch'], 400);
        }

        $period = $request->get('period', '30'); // days
        $startDate = Carbon::now()->subDays($period);

        // Get appointments count for their branch
        $appointments = Appointment::where('branch_id', $staff->branch_id)
            ->where('appointment_date', '>=', $startDate)
            ->get();

        $appointmentStats = [
            'total' => $appointments->count(),
            'completed' => $appointments->where('status', 'completed')->count(),
            'cancelled' => $appointments->where('status', 'cancelled')->count(),
            'scheduled' => $appointments->where('status', 'scheduled')->count(),
            'no_show_rate' => $appointments->count() > 0 ? 
                round(($appointments->where('status', 'cancelled')->count() / $appointments->count()) * 100, 1) : 0,
        ];

        // Get branch-level sales report (receipts)
        $receipts = \App\Models\Receipt::where('branch_id', $staff->branch_id)
            ->where('created_at', '>=', $startDate)
            ->get();

        $salesStats = [
            'total_receipts' => $receipts->count(),
            'total_revenue' => $receipts->sum('total_due'),
            'average_order_value' => $receipts->count() > 0 ?
                round($receipts->avg('total_due'), 2) : 0,
        ];

        // Get inventory usage (products sold vs stock left)
        $inventoryStats = $this->calculateInventoryStats($staff->branch_id, $startDate);

        // Get daily performance
        $dailyPerformance = $this->calculateDailyPerformance($staff->branch_id, $startDate);

        return response()->json([
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'branch' => [
                    'id' => $staff->branch->id,
                    'name' => $staff->branch->name,
                    'address' => $staff->branch->address,
                ],
            ],
            'period' => [
                'days' => $period,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => Carbon::now()->format('Y-m-d'),
            ],
            'appointments' => $appointmentStats,
            'sales' => $salesStats,
            'inventory' => $inventoryStats,
            'daily_performance' => $dailyPerformance,
        ]);
    }

    /**
     * Get admin analytics
     * GET /api/admin/analytics
     */
    public function getAdminAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $period = $request->get('period', '30'); // days
        $startDate = Carbon::now()->subDays($period);

        // Get comparison of branch performance
        $branchPerformance = $this->getBranchPerformanceComparison($startDate);

        // Get optometrist workload report
        $optometristWorkload = $this->getOptometristWorkloadReport($startDate);

        // Get staff activity logs
        $staffActivity = $this->getStaffActivityReport($startDate);

        // Get system-wide inventory + sales trends
        $systemWideStats = $this->getSystemWideStats($startDate);

        // Get most common diagnoses/prescriptions
        $commonDiagnoses = $this->getCommonDiagnoses($startDate);

        return response()->json([
            'period' => [
                'days' => $period,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => Carbon::now()->format('Y-m-d'),
            ],
            'branch_performance' => $branchPerformance,
            'optometrist_workload' => $optometristWorkload,
            'staff_activity' => $staffActivity,
            'system_wide_stats' => $systemWideStats,
            'common_diagnoses' => $commonDiagnoses,
        ]);
    }

    /**
     * Analyze vision trends from prescriptions
     */
    private function analyzeVisionTrends($prescriptions)
    {
        if ($prescriptions->count() < 2) {
            return [
                'trend_available' => false,
                'message' => 'Insufficient data for trend analysis'
            ];
        }

        $rightEyeSph = $prescriptions->pluck('right_eye.sph')->filter()->values();
        $leftEyeSph = $prescriptions->pluck('left_eye.sph')->filter()->values();
        $rightEyeCyl = $prescriptions->pluck('right_eye.cyl')->filter()->values();
        $leftEyeCyl = $prescriptions->pluck('left_eye.cyl')->filter()->values();

        return [
            'trend_available' => true,
            'right_eye' => [
                'sph_trend' => $this->calculateTrend($rightEyeSph),
                'cyl_trend' => $this->calculateTrend($rightEyeCyl),
            ],
            'left_eye' => [
                'sph_trend' => $this->calculateTrend($leftEyeSph),
                'cyl_trend' => $this->calculateTrend($leftEyeCyl),
            ],
        ];
    }

    /**
     * Calculate trend direction and magnitude
     */
    private function calculateTrend($values)
    {
        if ($values->count() < 2) {
            return 'insufficient_data';
        }

        $first = $values->first();
        $last = $values->last();
        $change = $last - $first;
        
        if (abs($change) < 0.25) {
            return 'stable';
        } elseif ($change > 0) {
            return 'increasing';
        } else {
            return 'decreasing';
        }
    }

    /**
     * Calculate follow-up compliance for optometrist
     */
    private function calculateFollowUpCompliance($optometristId, $startDate)
    {
        $appointments = Appointment::where('optometrist_id', $optometristId)
            ->where('appointment_date', '>=', $startDate)
            ->get();

        $totalAppointments = $appointments->count();
        $completedAppointments = $appointments->where('status', 'completed')->count();
        $cancelledAppointments = $appointments->where('status', 'cancelled')->count();

        return [
            'total_appointments' => $totalAppointments,
            'completed' => $completedAppointments,
            'cancelled' => $cancelledAppointments,
            'compliance_rate' => $totalAppointments > 0 ? 
                round(($completedAppointments / $totalAppointments) * 100, 1) : 0,
        ];
    }

    /**
     * Calculate workload distribution for optometrist
     */
    private function calculateWorkloadDistribution($optometristId, $startDate)
    {
        $appointments = Appointment::where('optometrist_id', $optometristId)
            ->where('appointment_date', '>=', $startDate)
            ->get();

        return [
            'by_type' => $appointments->groupBy('type')->map->count(),
            'by_status' => $appointments->groupBy('status')->map->count(),
            'by_weekday' => $appointments->groupBy(function ($appointment) {
                return $appointment->appointment_date->format('l');
            })->map->count(),
        ];
    }

    /**
     * Calculate inventory stats for staff branch
     */
    private function calculateInventoryStats($branchId, $startDate)
    {
        $branchStock = BranchStock::where('branch_id', $branchId)->get();

        $totalStock = $branchStock->sum('stock_quantity');
        $lowStockItems = $branchStock->where('stock_quantity', '<', 5)->count();
        $outOfStockItems = $branchStock->where('stock_quantity', '<=', 0)->count();

        return [
            'total_items' => $branchStock->count(),
            'total_stock' => $totalStock,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'sold_products' => $branchStock->count(), // Simplified for now
        ];
    }

    /**
     * Calculate daily performance for staff branch
     */
    private function calculateDailyPerformance($branchId, $startDate)
    {
        $appointments = Appointment::where('branch_id', $branchId)
            ->where('appointment_date', '>=', $startDate)
            ->get()
            ->groupBy(function ($appointment) {
                return $appointment->appointment_date->format('Y-m-d');
            });

        $receipts = \App\Models\Receipt::where('branch_id', $branchId)
            ->where('created_at', '>=', $startDate)
            ->get()
            ->groupBy(function ($receipt) {
                return $receipt->created_at->format('Y-m-d');
            });

        $dailyData = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte(Carbon::now())) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayAppointments = $appointments->get($dateStr, collect());
            $dayReceipts = $receipts->get($dateStr, collect());

            $dailyData[] = [
                'date' => $dateStr,
                'appointments' => $dayAppointments->count(),
                'completed_appointments' => $dayAppointments->where('status', 'completed')->count(),
                'receipts' => $dayReceipts->count(),
                'revenue' => $dayReceipts->sum('total_due'),
            ];

            $currentDate->addDay();
        }

        return $dailyData;
    }

    /**
     * Get branch performance comparison for admin
     */
    private function getBranchPerformanceComparison($startDate)
    {
        $branches = Branch::where('is_active', true)->get();
        $branchPerformance = [];

        foreach ($branches as $branch) {
            $appointments = Appointment::where('branch_id', $branch->id)
                ->where('appointment_date', '>=', $startDate)
                ->get();

            // Use receipts for revenue calculation instead of reservations
            $receipts = \App\Models\Receipt::where('branch_id', $branch->id)
                ->where('created_at', '>=', $startDate)
                ->get();

            $branchPerformance[] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'appointments' => $appointments->count(),
                'completed_appointments' => $appointments->where('status', 'completed')->count(),
                'revenue' => $receipts->sum('total_due'),
                'unique_patients' => $appointments->pluck('patient_id')->unique()->count(),
            ];
        }

        return $branchPerformance;
    }

    /**
     * Get optometrist workload report for admin
     */
    private function getOptometristWorkloadReport($startDate)
    {
        $optometrists = User::where('role', 'optometrist')->get();
        $workloadReport = [];

        foreach ($optometrists as $optometrist) {
            $appointments = Appointment::where('optometrist_id', $optometrist->id)
                ->where('appointment_date', '>=', $startDate)
                ->get();

            $prescriptions = Prescription::where('optometrist_id', $optometrist->id)
                ->where('issue_date', '>=', $startDate)
                ->get();

            $workloadReport[] = [
                'optometrist_id' => $optometrist->id,
                'optometrist_name' => $optometrist->name,
                'branch' => $optometrist->branch ? $optometrist->branch->name : 'No Branch',
                'appointments' => $appointments->count(),
                'prescriptions_issued' => $prescriptions->count(),
                'unique_patients' => $appointments->pluck('patient_id')->unique()->count(),
            ];
        }

        return $workloadReport;
    }

    /**
     * Get staff activity report for admin
     */
    private function getStaffActivityReport($startDate)
    {
        $staff = User::where('role', 'staff')->get();
        $activityReport = [];

        foreach ($staff as $staffMember) {
            if (!$staffMember->branch_id) continue;

            $appointments = Appointment::where('branch_id', $staffMember->branch_id)
                ->where('appointment_date', '>=', $startDate)
                ->get();

            $receipts = \App\Models\Receipt::where('branch_id', $staffMember->branch_id)
                ->where('created_at', '>=', $startDate)
                ->get();

            $activityReport[] = [
                'staff_id' => $staffMember->id,
                'staff_name' => $staffMember->name,
                'branch' => $staffMember->branch->name,
                'appointments_managed' => $appointments->count(),
                'receipts_processed' => $receipts->count(),
                'revenue_generated' => $receipts->sum('total_due'),
            ];
        }

        return $activityReport;
    }

    /**
     * Get system-wide stats for admin
     */
    private function getSystemWideStats($startDate)
    {
        $totalAppointments = Appointment::where('appointment_date', '>=', $startDate)->count();
        $totalReceipts = \App\Models\Receipt::where('created_at', '>=', $startDate)->count();
        $totalRevenue = \App\Models\Receipt::where('created_at', '>=', $startDate)->sum('total_due');

        $totalProducts = Product::count();
        $totalBranches = Branch::where('is_active', true)->count();
        $totalUsers = User::count();

        return [
            'appointments' => $totalAppointments,
            'receipts' => $totalReceipts,
            'revenue' => $totalRevenue,
            'products' => $totalProducts,
            'branches' => $totalBranches,
            'users' => $totalUsers,
        ];
    }

    /**
     * Get most common diagnoses/prescriptions for admin
     */
    private function getCommonDiagnoses($startDate)
    {
        $prescriptions = Prescription::where('issue_date', '>=', $startDate)->get();

        $commonTypes = $prescriptions->groupBy('type')->map->count()->sortDesc();
        $commonLensTypes = $prescriptions->groupBy('lens_type')->map->count()->sortDesc();
        $commonCoatings = $prescriptions->groupBy('coating')->map->count()->sortDesc();

        return [
            'by_type' => $commonTypes,
            'by_lens_type' => $commonLensTypes,
            'by_coating' => $commonCoatings,
        ];
    }

    /**
     * Get real-time analytics summary
     * GET /api/analytics/realtime
     */
    public function getRealTimeAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $today = Carbon::today();

        // Today's appointments
        $totalAppointmentsToday = Appointment::whereDate('appointment_date', $today)->count();

        // Today's revenue from receipts
        $totalRevenueToday = \App\Models\Receipt::whereDate('date', $today)->sum('total_due');

        // Active users (users who logged in recently)
        $activeUsers = User::where('last_seen_at', '>=', Carbon::now()->subHours(24))->count();

        // Low stock alerts
        $lowStockAlerts = BranchStock::where('stock_quantity', '<', 5)->count();

        // Upcoming appointments
        $upcomingAppointments = Appointment::where('appointment_date', Carbon::tomorrow())
            ->where('status', 'scheduled')
            ->count();

        // System health metrics
        $systemHealth = [
            'database_status' => 'healthy', // Simplified check
            'api_response_time' => 150, // Mock response time in ms
            'last_backup' => Carbon::now()->subDays(1)->format('Y-m-d H:i:s'),
        ];

        return response()->json([
            'total_appointments_today' => $totalAppointmentsToday,
            'total_revenue_today' => $totalRevenueToday,
            'active_users' => $activeUsers,
            'low_stock_alerts' => $lowStockAlerts,
            'upcoming_appointments' => $upcomingAppointments,
            'system_health' => $systemHealth,
        ]);
    }

    /**
     * Get analytics trends over time
     * GET /api/analytics/trends
     */
    public function getAnalyticsTrends(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $period = $request->get('period', 30); // days
        $branchId = $request->get('branch_id');
        $startDate = Carbon::now()->subDays($period);
        $endDate = Carbon::now();

        // Revenue trend
        $revenueTrendQuery = \App\Models\Receipt::select(
            DB::raw('DATE(date) as date'),
            DB::raw('SUM(total_due) as revenue'),
            DB::raw('COUNT(*) as transactions')
        )
        ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
        ->groupBy('date')
        ->orderBy('date');

        if ($branchId) {
            $revenueTrendQuery->where('branch_id', $branchId);
        }

        $revenueTrend = $revenueTrendQuery->get()->map(function ($item) {
            return [
                'date' => $item->date,
                'revenue' => (float)$item->revenue,
                'appointments' => 0, // Will be filled from appointment data
                'patients' => 0,
            ];
        })->keyBy('date');

        // Appointment trend
        $appointmentTrendQuery = Appointment::select(
            DB::raw('DATE(appointment_date) as date'),
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
            DB::raw('SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled')
        )
        ->whereBetween('appointment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
        ->groupBy('date')
        ->orderBy('date');

        if ($branchId) {
            $appointmentTrendQuery->where('branch_id', $branchId);
        }

        $appointmentTrend = $appointmentTrendQuery->get();

        // Combined trends
        $allDates = [];
        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $dateStr = $currentDate->format('Y-m-d');
            $allDates[] = $dateStr;
            $currentDate->addDay();
        }

        $combinedRevenueTrend = [];
        foreach ($allDates as $dateStr) {
            $revenueData = $revenueTrend->get($dateStr, (object)['revenue' => 0, 'appointments' => 0, 'patients' => 0]);
            $appointmentData = $appointmentTrend->where('date', $dateStr)->first();

            $combinedRevenueTrend[] = [
                'date' => $dateStr,
                'revenue' => $revenueData->revenue,
                'appointments' => $appointmentData ? $appointmentData->total : 0,
                'patients' => $appointmentData ? $appointmentData->completed : 0, // Using completed as patients
            ];
        }

        // Inventory trend (simplified)
        $inventoryTrend = collect([]);
        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $dateStr = $currentDate->format('Y-m-d');

            $query = BranchStock::select(
                DB::raw('COUNT(*) as total_items'),
                DB::raw('SUM(CASE WHEN stock_quantity < min_stock_threshold THEN 1 ELSE 0 END) as low_stock'),
                DB::raw('SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock')
            );

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $stats = $query->first();

            $inventoryTrend->push([
                'date' => $dateStr,
                'total_items' => $stats ? $stats->total_items : 0,
                'low_stock' => $stats ? $stats->low_stock : 0,
                'out_of_stock' => $stats ? $stats->out_of_stock : 0,
            ]);

            $currentDate->addDay();
        }

        // Appointment types
        $appointmentTypes = Appointment::select('type', DB::raw('COUNT(*) as value'))
            ->whereBetween('appointment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->groupBy('type')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->type,
                    'value' => $item->value,
                ];
            });

        return response()->json([
            'revenue_trend' => $combinedRevenueTrend,
            'appointment_trend' => $appointmentTrend,
            'inventory_trend' => $inventoryTrend,
            'appointment_types' => $appointmentTypes,
        ]);
    }

    /**
     * Export analytics as PDF
     * GET /api/reports/analytics/pdf?period=30
     */
    public function exportAnalyticsPdf(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role->value !== 'admin') {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            $period = $request->get('period', 30); // days
            $startDate = Carbon::now()->subDays($period);
            $endDate = Carbon::now();

            // Gather analytics data for PDF safely
            $totalAppointmentsCount = 0;
            $completedAppointments = 0;
            $totalRevenue = 0;

            try {
                $totalAppointmentsCount = Appointment::where('appointment_date', '>=', $startDate)->count();
                $completedAppointments = Appointment::where('appointment_date', '>=', $startDate)
                    ->where('status', 'completed')->count();
                $totalRevenue = \App\Models\Receipt::where('created_at', '>=', $startDate)->sum('total_due') ?: 0;
            } catch (\Exception $e) {
                \Log::warning('Error fetching basic analytics: ' . $e->getMessage());
            }

            // Branch performance (safely)
            $branches = [];
            $branchPerformance = [];

            try {
                $branches = Branch::select('id', 'name')->where('is_active', true)->get();

                foreach ($branches as $branch) {
                    try {
                        $branchAppointments = Appointment::where('branch_id', $branch->id)
                            ->where('appointment_date', '>=', $startDate)->count();

                        $branchRevenue = \App\Models\Receipt::where('branch_id', $branch->id)
                            ->where('created_at', '>=', $startDate)->sum('total_due') ?: 0;

                        $branchPerformance[] = [
                            'name' => $branch->name ?? 'Unknown Branch',
                            'appointments' => $branchAppointments,
                            'revenue' => number_format($branchRevenue, 2),
                        ];
                    } catch (\Exception $e) {
                        \Log::warning('Error fetching branch performance for branch ' . $branch->id . ': ' . $e->getMessage());
                        continue;
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Error fetching branches: ' . $e->getMessage());
                $branchPerformance = [['name' => 'No branch data available', 'appointments' => 0, 'revenue' => '0.00']];
            }

            // Weekly trend data for chart (safely)
            $weeklyData = [];
            try {
                for ($i = 0; $i < 4; $i++) {
                    $weekStart = $startDate->copy()->addWeeks($i);
                    $weekEnd = $weekStart->copy()->addDays(6);

                    try {
                        $weekRevenue = \App\Models\Receipt::whereBetween('created_at', [$weekStart, $weekEnd])->sum('total_due') ?: 0;
                        $weekAppointments = Appointment::whereBetween('appointment_date', [$weekStart, $weekEnd])->count();

                        $weeklyData[] = [
                            'week' => 'Week ' . ($i + 1),
                            'revenue' => $weekRevenue,
                            'appointments' => $weekAppointments,
                        ];
                    } catch (\Exception $e) {
                        $weeklyData[] = [
                            'week' => 'Week ' . ($i + 1),
                            'revenue' => 0,
                            'appointments' => 0,
                        ];
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Error generating weekly data: ' . $e->getMessage());
                $weeklyData = [];
            }

            // Prepare data for PDF view
            $data = [
                'period' => $period,
                'start_date' => $startDate->format('F j, Y'),
                'end_date' => $endDate->format('F j, Y'),
                'total_appointments' => $totalAppointmentsCount,
                'completed_appointments' => $completedAppointments,
                'total_revenue' => number_format($totalRevenue, 2),
                'branch_performance' => $branchPerformance,
                'weekly_data' => $weeklyData,
                'generated_at' => $endDate->format('F j, Y g:i A'),
                'generated_by' => $user->name ?? 'Admin',
            ];

            try {
                // Generate PDF using DomPDF
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.analytics-report', $data);
                $filename = 'analytics-report-' . now()->format('Y-m-d-H-i-s') . '.pdf';

                return $pdf->download($filename);
            } catch (\Exception $e) {
                \Log::error('PDF generation error: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Failed to generate PDF. Template may be missing or corrupted.',
                    'error' => $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Analytics PDF export error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json([
                'message' => 'Failed to generate analytics PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
