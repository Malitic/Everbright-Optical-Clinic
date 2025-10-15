<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Product;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Reservation;
use App\Models\Branch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GenerateAnalytics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:generate {--days=30 : Number of days to analyze} {--export= : Export format (json|csv)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate comprehensive analytics data for the optical clinic system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $exportFormat = $this->option('export');
        
        $this->info("🔍 Generating analytics for the last {$days} days...");
        $this->line("");

        // Calculate date range
        $endDate = Carbon::now();
        $startDate = Carbon::now()->subDays($days);

        $this->line("📅 Date range: {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}");
        $this->line("");

        // Initialize analytics data array
        $analyticsData = [
            'generated_at' => Carbon::now()->toISOString(),
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'days' => $days
            ]
        ];

        // Generate different types of analytics
        $analyticsData['user_analytics'] = $this->generateUserAnalytics($startDate, $endDate);
        $analyticsData['product_analytics'] = $this->generateProductAnalytics($startDate, $endDate);
        $analyticsData['appointment_analytics'] = $this->generateAppointmentAnalytics($startDate, $endDate);
        $analyticsData['prescription_analytics'] = $this->generatePrescriptionAnalytics($startDate, $endDate);
        $analyticsData['reservation_analytics'] = $this->generateReservationAnalytics($startDate, $endDate);
        $analyticsData['branch_analytics'] = $this->generateBranchAnalytics($startDate, $endDate);
        $analyticsData['revenue_analytics'] = $this->generateRevenueAnalytics($startDate, $endDate);

        // Export data if requested
        if ($exportFormat) {
            $this->exportAnalytics($analyticsData, $exportFormat);
        }

        $this->line("");
        $this->info('✅ Analytics generation completed successfully!');
        
        if ($exportFormat) {
            $this->info("📁 Data exported in {$exportFormat} format");
        }
    }

    private function generateUserAnalytics($startDate, $endDate)
    {
        $this->line("👥 User Analytics:");
        
        // Total users
        $totalUsers = User::count();
        $this->line("   Total Users: {$totalUsers}");

        // New users in period
        $newUsers = User::whereBetween('created_at', [$startDate, $endDate])->count();
        $this->line("   New Users: {$newUsers}");

        // Users by role
        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get();
        
        $roleData = [];
        foreach ($usersByRole as $role) {
            $roleValue = is_object($role->role) ? $role->role->value : $role->role;
            $this->line("   - {$roleValue}: {$role->count}");
            $roleData[$roleValue] = $role->count;
        }

        // Approved vs Pending users
        $approvedUsers = User::where('is_approved', true)->count();
        $pendingUsers = User::where('is_approved', false)->count();
        $this->line("   - Approved: {$approvedUsers}");
        $this->line("   - Pending: {$pendingUsers}");

        return [
            'total_users' => $totalUsers,
            'new_users' => $newUsers,
            'users_by_role' => $roleData,
            'approved_users' => $approvedUsers,
            'pending_users' => $pendingUsers
        ];
    }

    private function generateProductAnalytics($startDate, $endDate)
    {
        $this->line("🛍️ Product Analytics:");
        
        // Total products
        $totalProducts = Product::count();
        $this->line("   Total Products: {$totalProducts}");

        // Active products
        $activeProducts = Product::where('is_active', true)->count();
        $this->line("   Active Products: {$activeProducts}");

        // New products in period
        $newProducts = Product::whereBetween('created_at', [$startDate, $endDate])->count();
        $this->line("   New Products: {$newProducts}");

        // Products by category
        $productsByCategory = Product::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->get();
        
        $categoryData = [];
        foreach ($productsByCategory as $category) {
            $this->line("   - {$category->category}: {$category->count}");
            $categoryData[$category->category] = $category->count;
        }

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'new_products' => $newProducts,
            'products_by_category' => $categoryData
        ];
    }

    private function generateAppointmentAnalytics($startDate, $endDate)
    {
        $this->line("📅 Appointment Analytics:");
        
        // Total appointments in period
        $totalAppointments = Appointment::whereBetween('created_at', [$startDate, $endDate])->count();
        $this->line("   Total Appointments: {$totalAppointments}");

        // Appointments by status
        $appointmentsByStatus = Appointment::select('status', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->get();
        
        $statusData = [];
        foreach ($appointmentsByStatus as $status) {
            $this->line("   - {$status->status}: {$status->count}");
            $statusData[$status->status] = $status->count;
        }

        // Average appointments per day
        $avgPerDay = $totalAppointments > 0 ? round($totalAppointments / $this->option('days'), 2) : 0;
        $this->line("   Average per day: {$avgPerDay}");

        return [
            'total_appointments' => $totalAppointments,
            'appointments_by_status' => $statusData,
            'average_per_day' => $avgPerDay
        ];
    }

    private function generatePrescriptionAnalytics($startDate, $endDate)
    {
        $this->line("💊 Prescription Analytics:");
        
        // Total prescriptions in period
        $totalPrescriptions = Prescription::whereBetween('created_at', [$startDate, $endDate])->count();
        $this->line("   Total Prescriptions: {$totalPrescriptions}");

        // Prescriptions by status
        $prescriptionsByStatus = Prescription::select('status', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->get();
        
        $statusData = [];
        foreach ($prescriptionsByStatus as $status) {
            $this->line("   - {$status->status}: {$status->count}");
            $statusData[$status->status] = $status->count;
        }

        return [
            'total_prescriptions' => $totalPrescriptions,
            'prescriptions_by_status' => $statusData
        ];
    }

    private function generateReservationAnalytics($startDate, $endDate)
    {
        $this->line("📋 Reservation Analytics:");
        
        // Total reservations in period
        $totalReservations = Reservation::whereBetween('created_at', [$startDate, $endDate])->count();
        $this->line("   Total Reservations: {$totalReservations}");

        // Reservations by status
        $reservationsByStatus = Reservation::select('status', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->get();
        
        $statusData = [];
        foreach ($reservationsByStatus as $status) {
            $this->line("   - {$status->status}: {$status->count}");
            $statusData[$status->status] = $status->count;
        }

        return [
            'total_reservations' => $totalReservations,
            'reservations_by_status' => $statusData
        ];
    }

    private function generateBranchAnalytics($startDate, $endDate)
    {
        $this->line("🏢 Branch Analytics:");
        
        // Total branches
        $totalBranches = Branch::count();
        $this->line("   Total Branches: {$totalBranches}");

        // Active branches
        $activeBranches = Branch::where('is_active', true)->count();
        $this->line("   Active Branches: {$activeBranches}");

        // Appointments by branch
        $appointmentsByBranch = Appointment::select('branch_id', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('branch_id')
            ->groupBy('branch_id')
            ->with('branch')
            ->get();
        
        $branchData = [];
        foreach ($appointmentsByBranch as $appointment) {
            $branchName = $appointment->branch ? $appointment->branch->name : "Branch {$appointment->branch_id}";
            $this->line("   - {$branchName}: {$appointment->count} appointments");
            $branchData[$branchName] = $appointment->count;
        }

        return [
            'total_branches' => $totalBranches,
            'active_branches' => $activeBranches,
            'appointments_by_branch' => $branchData
        ];
    }

    private function generateRevenueAnalytics($startDate, $endDate)
    {
        $this->line("💰 Revenue Analytics:");
        
        // This is a placeholder - you can implement actual revenue calculations
        // based on your payment system, product sales, etc.
        
        $this->line("   Revenue tracking not implemented yet");
        $this->line("   (Implement based on your payment/sales system)");

        return [
            'note' => 'Revenue tracking not implemented yet'
        ];
    }

    private function exportAnalytics($data, $format)
    {
        $filename = 'analytics_' . Carbon::now()->format('Y-m-d_H-i-s') . '.' . $format;
        $filepath = storage_path('app/analytics/' . $filename);

        // Create directory if it doesn't exist
        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        if ($format === 'json') {
            file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT));
        } elseif ($format === 'csv') {
            // Convert to CSV format (simplified)
            $csv = "Metric,Value\n";
            $this->flattenArray($data, $csv);
            file_put_contents($filepath, $csv);
        }

        $this->line("📁 Analytics exported to: {$filepath}");
    }

    private function flattenArray($array, &$csv, $prefix = '')
    {
        foreach ($array as $key => $value) {
            $newKey = $prefix ? "{$prefix}.{$key}" : $key;
            
            if (is_array($value)) {
                $this->flattenArray($value, $csv, $newKey);
            } else {
                $csv .= "\"{$newKey}\",\"{$value}\"\n";
            }
        }
    }
}
