<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\AnalyticsTestSeeder;

class SeedAnalyticsTestData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:seed-test-data {--force : Force seeding even if recent data exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely seed 2 months of analytics test data for testing purposes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->newLine();
        $this->info('🔍 Analytics Test Data Seeder');
        $this->line('This will generate 2 months of realistic test data for analytics testing.');
        $this->newLine();

        if ($this->option('force')) {
            $this->warn('⚠️  Force mode enabled - safety checks will be bypassed!');
            
            if (!$this->confirm('Are you absolutely sure you want to force seed test data?')) {
                $this->info('Operation cancelled.');
                return;
            }
        }

        $this->info('Starting analytics test data generation...');
        $this->newLine();

        try {
            // Create and run the seeder
            $seeder = new AnalyticsTestSeeder();
            $seeder->setCommand($this);
            $seeder->run();

            $this->newLine();
            $this->info('✅ Analytics test data seeding completed successfully!');
            $this->newLine();
            
            // Show summary
            $this->showDataSummary();
            
        } catch (\Exception $e) {
            $this->error('❌ Error during seeding: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }

    private function showDataSummary()
    {
        $this->info('📊 Generated Data Summary:');
        $this->line('');
        
        // Count recent data (last 60 days)
        $recentAppointments = \App\Models\Appointment::whereDate('created_at', '>=', now()->subDays(60))->count();
        $recentReceipts = \App\Models\Receipt::whereDate('created_at', '>=', now()->subDays(60))->count();
        $recentFeedback = \App\Models\Feedback::whereDate('created_at', '>=', now()->subDays(60))->count();
        $recentPrescriptions = \App\Models\Prescription::whereDate('created_at', '>=', now()->subDays(60))->count();

        $this->line("  📅 Appointments (last 60 days): {$recentAppointments}");
        $this->line("  🧾 Receipts (last 60 days): {$recentReceipts}");
        $this->line("  💬 Feedback (last 60 days): {$recentFeedback}");
        $this->line("  💊 Prescriptions (last 60 days): {$recentPrescriptions}");
        $this->newLine();

        $this->info('🎯 Next Steps:');
        $this->line('  1. Test your analytics dashboard');
        $this->line('  2. Verify data appears in charts and reports');
        $this->line('  3. Test real-time notifications (if WebSocket is running)');
        $this->newLine();

        $this->info('💡 Useful Commands:');
        $this->line('  • View analytics: php artisan analytics:generate --days=30');
        $this->line('  • Clear test data: php artisan migrate:fresh --seed');
        $this->line('  • Check database: php artisan tinker');
    }
}
