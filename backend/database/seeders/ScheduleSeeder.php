<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\User;
use App\Models\Branch;

class ScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first optometrist and branch
        $optometrist = User::where('role', 'optometrist')->first();
        $branch = Branch::first();

        if (!$optometrist || !$branch) {
            $this->command->warn('No optometrist or branch found. Skipping schedule seeding.');
            return;
        }

        // Create schedules for Monday to Friday (1-5)
        for ($dayOfWeek = 1; $dayOfWeek <= 5; $dayOfWeek++) {
            Schedule::create([
                'staff_id' => $optometrist->id,
                'staff_role' => 'optometrist',
                'branch_id' => $branch->id,
                'day_of_week' => $dayOfWeek,
                'start_time' => '09:00:00',
                'end_time' => '17:00:00',
                'is_active' => true,
                'created_by' => 1, // Assuming admin user with ID 1
                'updated_by' => 1,
            ]);
        }

        $this->command->info('Created schedules for optometrist: ' . $optometrist->name);
    }
}
