<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ForceAnalyticsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * WARNING: This bypasses all safety checks!
     * Only use for testing or when you're absolutely sure.
     */
    public function run(): void
    {
        $this->command->newLine();
        $this->command->error('╔════════════════════════════════════════════════════════════════╗');
        $this->command->error('║  ⚠️  FORCE SEEDER - BYPASSING SAFETY CHECKS!  ⚠️              ║');
        $this->command->error('╚════════════════════════════════════════════════════════════════╝');
        $this->command->newLine();
        $this->command->warn('This will generate test data even if recent data exists!');
        $this->command->newLine();
        
        // Ask for confirmation
        if (!$this->command->confirm('Are you absolutely sure you want to continue?')) {
            $this->command->info('Operation cancelled.');
            return;
        }

        // Temporarily modify the AnalyticsTestSeeder to bypass safety checks
        $this->command->info('🔧 Bypassing safety checks...');
        
        // Call the analytics seeder with force flag
        $this->call(AnalyticsTestSeeder::class, ['force' => true]);
        
        $this->command->newLine();
        $this->command->info('✅ Force seeding completed!');
        $this->command->warn('⚠️  Remember: This may have created duplicate or conflicting data!');
    }
}
