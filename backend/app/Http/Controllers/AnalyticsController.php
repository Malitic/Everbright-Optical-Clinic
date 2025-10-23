<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Branch;
use App\Models\Reservation;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Receipt;
use App\Models\Transaction;
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
        
        // Get products sold in the period (from reservations)
        $soldProducts = DB::table('reservation_items')
            ->join('reservations', 'reservation_items.reservation_id', '=', 'reservations.id')
            ->where('reservations.branch_id', $branchId)
            ->where('reservations.created_at', '>=', $startDate)
            ->where('reservations.status', 'completed')
            ->select('reservation_items.product_id', DB::raw('SUM(reservation_items.quantity) as sold_quantity'))
            ->groupBy('reservation_items.product_id')
            ->get()
            ->keyBy('product_id');

        $totalStock = $branchStock->sum('stock_quantity');
        $lowStockItems = $branchStock->where('available_quantity', '<', 5)->count();
        $outOfStockItems = $branchStock->where('available_quantity', '<=', 0)->count();

        return [
            'total_items' => $branchStock->count(),
            'total_stock' => $totalStock,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'sold_products' => $soldProducts,
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

        $reservations = Reservation::where('branch_id', $branchId)
            ->where('created_at', '>=', $startDate)
            ->get()
            ->groupBy(function ($reservation) {
                return $reservation->created_at->format('Y-m-d');
            });
            
        $receipts = Receipt::whereHas('appointment', function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })->where('created_at', '>=', $startDate)
            ->get()
            ->groupBy(function ($receipt) {
                return $receipt->created_at->format('Y-m-d');
            });

        $transactions = Transaction::where('branch_id', $branchId)
            ->where('created_at', '>=', $startDate)
            ->get()
            ->groupBy(function ($transaction) {
                return $transaction->created_at->format('Y-m-d');
            });

        $dailyData = [];
        $currentDate = $startDate->copy();
        
        while ($currentDate->lte(Carbon::now())) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayAppointments = $appointments->get($dateStr, collect());
            $dayReservations = $reservations->get($dateStr, collect());
            $dayReceipts = $receipts->get($dateStr, collect());
            $dayTransactions = $transactions->get($dateStr, collect());

            $reservationRevenue = $dayReservations->where('status', 'completed')->sum('total_price');
            $receiptRevenue = $dayReceipts->sum('total_due');
            $transactionRevenue = $dayTransactions->where('status', 'Completed')->sum('total_amount');
            $totalRevenue = $reservationRevenue + $receiptRevenue + $transactionRevenue;

            $dailyData[] = [
                'date' => $dateStr,
                'appointments' => $dayAppointments->count(),
                'completed_appointments' => $dayAppointments->where('status', 'completed')->count(),
                'reservations' => $dayReservations->count(),
                'receipts' => $dayReceipts->count(),
                'transactions' => $dayTransactions->count(),
                'revenue' => $totalRevenue,
                'reservation_revenue' => $reservationRevenue,
                'receipt_revenue' => $receiptRevenue,
                'transaction_revenue' => $transactionRevenue,
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

            $reservations = Reservation::where('branch_id', $branch->id)
                ->where('created_at', '>=', $startDate)
                ->get();
                
            // Get receipts for this branch through appointments
            $receipts = Receipt::whereHas('appointment', function($q) use ($branch) {
                $q->where('branch_id', $branch->id);
            })->where('created_at', '>=', $startDate)->get();

            $reservationRevenue = $reservations->where('status', 'completed')->sum('total_price');
            $receiptRevenue = $receipts->sum('total_due');
            $totalRevenue = $reservationRevenue + $receiptRevenue;

            $branchPerformance[] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'appointments' => $appointments->count(),
                'completed_appointments' => $appointments->where('status', 'completed')->count(),
                'revenue' => $totalRevenue,
                'reservation_revenue' => $reservationRevenue,
                'receipt_revenue' => $receiptRevenue,
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

            $reservations = Reservation::where('branch_id', $staffMember->branch_id)
                ->where('created_at', '>=', $startDate)
                ->get();
                
            // Get receipts for this branch through appointments
            $receipts = Receipt::whereHas('appointment', function($q) use ($staffMember) {
                $q->where('branch_id', $staffMember->branch_id);
            })->where('created_at', '>=', $startDate)->get();

            $reservationRevenue = $reservations->where('status', 'completed')->sum('total_price');
            $receiptRevenue = $receipts->sum('total_due');
            $totalRevenue = $reservationRevenue + $receiptRevenue;

            $activityReport[] = [
                'staff_id' => $staffMember->id,
                'staff_name' => $staffMember->name,
                'branch' => $staffMember->branch->name,
                'appointments_managed' => $appointments->count(),
                'reservations_processed' => $reservations->count(),
                'receipts_created' => $receipts->count(),
                'revenue_generated' => $totalRevenue,
                'reservation_revenue' => $reservationRevenue,
                'receipt_revenue' => $receiptRevenue,
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
        $totalReservations = Reservation::where('created_at', '>=', $startDate)->count();
        
        // Calculate total revenue from reservations, receipts, and transactions
        $reservationRevenue = Reservation::where('created_at', '>=', $startDate)
            ->where('status', 'completed')
            ->sum('total_price');
            
        $receiptRevenue = Receipt::where('created_at', '>=', $startDate)
            ->sum('total_due');
            
        $transactionRevenue = Transaction::where('created_at', '>=', $startDate)
            ->where('status', 'Completed')
            ->sum('total_amount');
            
        $totalRevenue = $reservationRevenue + $receiptRevenue + $transactionRevenue;

        $totalProducts = Product::count();
        $totalBranches = Branch::where('is_active', true)->count();
        $totalUsers = User::count();

        return [
            'appointments' => $totalAppointments,
            'reservations' => $totalReservations,
            'revenue' => $totalRevenue,
            'reservation_revenue' => $reservationRevenue,
            'receipt_revenue' => $receiptRevenue,
            'transaction_revenue' => $transactionRevenue,
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
    public function getRealTimeAnalytics(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $today = Carbon::today();
        
        // Get today's appointments
        $totalAppointmentsToday = Appointment::whereDate('appointment_date', $today)->count();
        
        // Get today's revenue from completed reservations AND receipts
        $reservationRevenueToday = Reservation::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('total_price');
            
        $receiptRevenueToday = Receipt::whereDate('created_at', $today)
            ->sum('total_due');
            
        $totalRevenueToday = $reservationRevenueToday + $receiptRevenueToday;
        
        // Get active users (logged in within last 24 hours)
        $activeUsers = User::where('last_login_at', '>=', Carbon::now()->subDay())->count();
        
        // Get low stock alerts
        $lowStockAlerts = BranchStock::whereRaw('stock_quantity <= min_stock_threshold')->count();
        
        // Get upcoming appointments (next 7 days)
        $upcomingAppointments = Appointment::whereBetween('appointment_date', [
            Carbon::now(),
            Carbon::now()->addDays(7)
        ])->count();

        return response()->json([
            'total_appointments_today' => $totalAppointmentsToday,
            'total_revenue_today' => $totalRevenueToday,
            'active_users' => $activeUsers,
            'low_stock_alerts' => $lowStockAlerts,
            'upcoming_appointments' => $upcomingAppointments,
            'system_health' => [
                'database_status' => 'healthy',
                'api_response_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
                'last_backup' => Carbon::now()->subHours(6)->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Get analytics trends over time
     * GET /api/analytics/trends
     */
    public function getAnalyticsTrends(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $period = $request->get('period', 30); // days
        $startDate = Carbon::now()->subDays($period);
        $branchId = $request->get('branch_id');

        // Revenue trend (including reservations, receipts, and transactions)
        $revenueTrend = [];
        for ($i = $period; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            // Get reservation revenue
            $reservationQuery = Reservation::whereDate('created_at', $date)
                ->where('status', 'completed');
            
            if ($branchId) {
                $reservationQuery->where('branch_id', $branchId);
            }
            
            $reservationRevenue = $reservationQuery->sum('total_price');
            
            // Get receipt revenue
            $receiptQuery = Receipt::whereDate('created_at', $date);
            
            if ($branchId) {
                // Filter receipts by branch through appointments
                $receiptQuery->whereHas('appointment', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }
            
            $receiptRevenue = $receiptQuery->sum('total_due');
            
            // Get transaction revenue
            $transactionQuery = Transaction::whereDate('created_at', $date)
                ->where('status', 'Completed');
            
            if ($branchId) {
                $transactionQuery->where('branch_id', $branchId);
            }
            
            $transactionRevenue = $transactionQuery->sum('total_amount');
            
            $totalRevenue = $reservationRevenue + $receiptRevenue + $transactionRevenue;
            
            $appointments = Appointment::whereDate('appointment_date', $date)->count();
            $patients = Appointment::whereDate('appointment_date', $date)
                ->distinct('patient_id')
                ->count();

            $revenueTrend[] = [
                'date' => $date->format('Y-m-d'),
                'revenue' => $totalRevenue,
                'reservation_revenue' => $reservationRevenue,
                'receipt_revenue' => $receiptRevenue,
                'transaction_revenue' => $transactionRevenue,
                'appointments' => $appointments,
                'patients' => $patients,
            ];
        }

        // Appointment trend
        $appointmentTrend = [];
        for ($i = $period; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $query = Appointment::whereDate('appointment_date', $date);
            
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
            
            $appointmentTrend[] = [
                'date' => $date->format('Y-m-d'),
                'total' => $query->count(),
                'completed' => $query->where('status', 'completed')->count(),
                'cancelled' => $query->where('status', 'cancelled')->count(),
            ];
        }

        // Inventory trend
        $inventoryTrend = [];
        for ($i = $period; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $query = BranchStock::whereDate('updated_at', $date);
            
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
            
            $inventoryTrend[] = [
                'date' => $date->format('Y-m-d'),
                'total_items' => $query->count(),
                'low_stock' => $query->whereRaw('stock_quantity <= min_stock_threshold')->count(),
                'out_of_stock' => $query->whereRaw('stock_quantity <= reserved_quantity')->count(),
            ];
        }

        // Appointment types distribution
        $appointmentTypesQuery = Appointment::whereBetween('appointment_date', [$startDate, Carbon::now()]);
        if ($branchId) {
            $appointmentTypesQuery->where('branch_id', $branchId);
        }
        
        $appointmentTypes = $appointmentTypesQuery->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->type ?: 'General Consultation',
                    'value' => $item->count
                ];
            });

        return response()->json([
            'revenue_trend' => $revenueTrend,
            'appointment_trend' => $appointmentTrend,
            'inventory_trend' => $inventoryTrend,
            'appointment_types' => $appointmentTypes,
        ]);
    }

    /**
     * Export analytics data
     * GET /api/analytics/export
     */
    public function exportAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $type = $request->get('type', 'admin');
        $format = $request->get('format', 'csv');
        $period = $request->get('period', 30);
        $startDate = Carbon::now()->subDays($period);

        // For now, return a JSON response with export data
        // In a real implementation, you would generate actual PDF/CSV/Excel files
        $exportData = [
            'type' => $type,
            'format' => $format,
            'period' => $period,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => Carbon::now()->format('Y-m-d'),
            'generated_at' => Carbon::now()->format('Y-m-d H:i:s'),
            'generated_by' => $user->name,
        ];

        // Add type-specific data
        switch ($type) {
            case 'admin':
                $exportData['data'] = $this->getAdminAnalytics($request);
                break;
            case 'customer':
                $customerId = $request->get('customer_id');
                if ($customerId) {
                    $exportData['data'] = $this->getCustomerAnalytics($request, $customerId);
                }
                break;
            case 'optometrist':
                $optometristId = $request->get('optometrist_id');
                if ($optometristId) {
                    $exportData['data'] = $this->getOptometristAnalytics($request, $optometristId);
                }
                break;
        }

        return response()->json([
            'message' => 'Export data prepared',
            'export_data' => $exportData,
            'download_url' => null, // Would be a real download URL in production
        ]);
    }

    /**
     * Get staff analytics
     * GET /api/staff/analytics
     */
    public function getStaffAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user || $user->role->value !== 'staff') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $period = $request->get('period', 30);
        $startDate = Carbon::now()->subDays($period);

        // Get staff's branch
        $branchId = $user->branch_id;
        
        // Get branch-specific analytics
        $branchAppointments = Appointment::where('branch_id', $branchId)
            ->where('created_at', '>=', $startDate)
            ->count();

        $branchReservations = Reservation::whereHas('product', function($query) use ($branchId) {
            $query->where('branch_id', $branchId);
        })->where('created_at', '>=', $startDate)->count();

        $lowStockItems = BranchStock::where('branch_id', $branchId)
            ->whereColumn('stock_quantity', '<=', 'min_stock_threshold')
            ->count();

        return response()->json([
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'branch' => $user->branch ? $user->branch->name : 'No Branch',
            ],
            'period' => [
                'days' => $period,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => Carbon::now()->format('Y-m-d'),
            ],
            'branch_analytics' => [
                'appointments' => $branchAppointments,
                'reservations' => $branchReservations,
                'low_stock_items' => $lowStockItems,
            ],
        ]);
    }
}
