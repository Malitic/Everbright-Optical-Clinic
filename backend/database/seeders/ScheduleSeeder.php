<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\User;
use App\Models\Branch;
use App\Enums\UserRole;

class ScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Dr. Samuel Loreto Prieto
        $samuel = User::where('role', UserRole::OPTOMETRIST)
            ->where('name', 'Samuel Loreto Prieto')
            ->first();

        if (!$samuel) {
            $this->command->error('Samuel Loreto Prieto not found. Please run the main seeder first.');
            return;
        }

        // Get all branches
        $branches = Branch::all();
        if ($branches->isEmpty()) {
            $this->command->error('No branches found. Please run the main seeder first.');
            return;
        }

        // Clear existing schedules for Samuel
        Schedule::where('optometrist_id', $samuel->id)->delete();

        // Create weekly rotation schedule
        $scheduleData = [
            // Monday - Unitop Branch
            ['day_of_week' => 1, 'branch_name' => 'Unitop Branch', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Tuesday - Newstar Branch  
            ['day_of_week' => 2, 'branch_name' => 'Newstar Branch', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Wednesday - Garnet Branch
            ['day_of_week' => 3, 'branch_name' => 'Garnet Branch', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Thursday - Emerald Branch
            ['day_of_week' => 4, 'branch_name' => 'Emerald Branch', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Friday - Unitop Branch
            ['day_of_week' => 5, 'branch_name' => 'Unitop Branch', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Saturday - Newstar Branch
            ['day_of_week' => 6, 'branch_name' => 'Newstar Branch', 'start_time' => '09:00:00', 'end_time' => '17:00:00'],
            // Sunday - Garnet Branch (shorter hours)
            ['day_of_week' => 7, 'branch_name' => 'Garnet Branch', 'start_time' => '10:00:00', 'end_time' => '16:00:00'],
        ];

        foreach ($scheduleData as $data) {
            $branch = $branches->firstWhere('name', $data['branch_name']);
            if ($branch) {
                Schedule::create([
                    'optometrist_id' => $samuel->id,
                    'branch_id' => $branch->id,
                    'day_of_week' => $data['day_of_week'],
                    'start_time' => $data['start_time'],
                    'end_time' => $data['end_time'],
                    'is_active' => true,
                ]);
                
                $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                $dayName = $dayNames[$data['day_of_week'] - 1];
                $this->command->info("✓ " . $dayName . ": " . $branch->name . " (" . date("g:i A", strtotime($data['start_time'])) . " - " . date("g:i A", strtotime($data['end_time'])) . ")");
            } else {
                $this->command->error("Branch not found: " . $data['branch_name']);
            }
        }

        $this->command->info('Samuel Loreto Prieto\'s weekly rotation schedule has been created!');
    }
}
