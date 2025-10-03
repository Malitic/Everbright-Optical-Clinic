<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\User;
use App\Models\Branch;
use App\Enums\UserRole;

class SamuelScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Dr. Samuel Loreto Prieto if he doesn't exist
        $samuel = User::firstOrCreate(
            ['email' => 'samuel.prieto@everbright.com'],
            [
                'name' => 'Dr. Samuel Loreto Prieto',
                'password' => bcrypt('password123'),
                'role' => UserRole::OPTOMETRIST,
                'is_approved' => true,
                'email_verified_at' => now(),
            ]
        );

        // Get all branches
        $branches = Branch::all();
        
        if ($branches->isEmpty()) {
            $this->command->error('No branches found. Please run the branch seeder first.');
            return;
        }

        // Clear existing schedules for Samuel
        Schedule::where('optometrist_id', $samuel->id)->delete();

        // Create 6-day weekly rotation schedule (Monday to Saturday)
        $scheduleData = [
            // Monday - UNITOP
            ['day_of_week' => 1, 'branch_code' => 'UNITOP', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Tuesday - NEWSTAR
            ['day_of_week' => 2, 'branch_code' => 'NEWSTAR', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Wednesday - BALIBAGO
            ['day_of_week' => 3, 'branch_code' => 'BALIBAGO', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Thursday - GARNET
            ['day_of_week' => 4, 'branch_code' => 'GARNET', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Friday - UNITOP
            ['day_of_week' => 5, 'branch_code' => 'UNITOP', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Saturday - NEWSTAR (shorter hours)
            ['day_of_week' => 6, 'branch_code' => 'NEWSTAR', 'start_time' => '09:00:00', 'end_time' => '13:00:00'],
        ];

        foreach ($scheduleData as $schedule) {
            $branch = $branches->where('code', $schedule['branch_code'])->first();
            
            if ($branch) {
                Schedule::create([
                    'optometrist_id' => $samuel->id,
                    'branch_id' => $branch->id,
                    'day_of_week' => $schedule['day_of_week'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                    'is_active' => true,
                ]);
                
                $this->command->info("Created schedule for {$schedule['day_of_week']} at {$branch->name}");
            }
        }

        $this->command->info('Samuel schedule created successfully!');
    }
}