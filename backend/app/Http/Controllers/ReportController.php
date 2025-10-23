<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Feedback;
use App\Models\Appointment;
use App\Models\Reservation;
use App\Models\Receipt;
use App\Models\User;
use App\Models\Branch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Generate analytics PDF report
     */
    public function generateAnalyticsReport(Request $request)
    {
        $user = Auth::user();
        
        if (!$user || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $period = $request->get('period', 30); // days
        $branchId = $request->get('branch_id');
        $startDate = Carbon::now()->subDays($period);
        $endDate = Carbon::now();

        // Get analytics data
        $analyticsData = $this->getAnalyticsData($startDate, $endDate, $branchId);
        
        // Generate PDF
        $pdf = Pdf::loadView('reports.analytics', [
            'analytics' => $analyticsData,
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'branchId' => $branchId,
            'generatedAt' => Carbon::now(),
            'generatedBy' => $user->name
        ]);

        $filename = 'analytics_report_' . Carbon::now()->format('Y-m-d_H-i-s') . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Get comprehensive analytics data
     */
    private function getAnalyticsData($startDate, $endDate, $branchId = null)
    {
        // Base query conditions
        $baseConditions = function($query) use ($startDate, $endDate, $branchId) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        };

        // Revenue Analytics
        $reservationRevenue = Reservation::where($baseConditions)
            ->where('status', 'completed')
            ->sum('total_price');
            
        $receiptRevenue = Receipt::whereHas('appointment', function($q) use ($startDate, $endDate, $branchId) {
            $q->whereBetween('appointment_date', [$startDate, $endDate]);
            if ($branchId) {
                $q->where('branch_id', $branchId);
            }
        })->sum('total_due');
        
        $totalRevenue = $reservationRevenue + $receiptRevenue;

        // Appointment Analytics
        $appointmentsQuery = Appointment::whereBetween('appointment_date', [$startDate, $endDate]);
        if ($branchId) {
            $appointmentsQuery->where('branch_id', $branchId);
        }
        
        $totalAppointments = $appointmentsQuery->count();
        $completedAppointments = $appointmentsQuery->where('status', 'completed')->count();
        $cancelledAppointments = $appointmentsQuery->where('status', 'cancelled')->count();

        // Feedback Analytics
        $feedbackQuery = Feedback::whereBetween('created_at', [$startDate, $endDate]);
        if ($branchId) {
            $feedbackQuery->where('branch_id', $branchId);
        }
        
        $totalFeedback = $feedbackQuery->count();
        $avgRating = $feedbackQuery->avg('rating');
        $uniqueCustomers = $feedbackQuery->distinct('customer_id')->count();

        // Branch Performance
        $branches = Branch::where('is_active', true)->get();
        $branchPerformance = [];
        
        foreach ($branches as $branch) {
            if ($branchId && $branch->id != $branchId) continue;
            
            $branchAppointments = Appointment::whereBetween('appointment_date', [$startDate, $endDate])
                ->where('branch_id', $branch->id)->count();
                
            $branchRevenue = Reservation::whereBetween('created_at', [$startDate, $endDate])
                ->where('branch_id', $branch->id)
                ->where('status', 'completed')
                ->sum('total_price');
                
            $branchFeedback = Feedback::whereBetween('created_at', [$startDate, $endDate])
                ->where('branch_id', $branch->id)
                ->avg('rating');

            $branchPerformance[] = [
                'name' => $branch->name,
                'appointments' => $branchAppointments,
                'revenue' => $branchRevenue,
                'avg_rating' => round($branchFeedback, 2)
            ];
        }

        // Top Services
        $topServices = Appointment::whereBetween('appointment_date', [$startDate, $endDate])
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();

        // Recent Feedback
        $recentFeedback = Feedback::with(['customer', 'branch'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return [
            'revenue' => [
                'total' => $totalRevenue,
                'reservations' => $reservationRevenue,
                'receipts' => $receiptRevenue
            ],
            'appointments' => [
                'total' => $totalAppointments,
                'completed' => $completedAppointments,
                'cancelled' => $cancelledAppointments,
                'completion_rate' => $totalAppointments > 0 ? round(($completedAppointments / $totalAppointments) * 100, 2) : 0
            ],
            'feedback' => [
                'total' => $totalFeedback,
                'avg_rating' => round($avgRating, 2),
                'unique_customers' => $uniqueCustomers,
                'response_rate' => $totalAppointments > 0 ? round(($totalFeedback / $totalAppointments) * 100, 2) : 0
            ],
            'branch_performance' => $branchPerformance,
            'top_services' => $topServices,
            'recent_feedback' => $recentFeedback
        ];
    }
}

