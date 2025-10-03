<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Schedule;
use App\Models\User;
use App\Models\Branch;

echo "=== FIXING SCHEDULE DATA ===\n\n";

try {
    // 1. Create Samuel if he doesn't exist
    $samuel = User::where('name', 'like', '%Samuel%')->where('role', 'optometrist')->first();
    
    if (!$samuel) {
        echo "Creating Samuel...\n";
        $samuel = User::create([
            'name' => 'Samuel Loreto Prieto',
            'email' => 'samuel.prieto@everbright.com',
            'password' => bcrypt('password123'),
            'role' => 'optometrist',
            'is_approved' => true,
            'email_verified_at' => now(),
        ]);
        echo "✅ Created Samuel with ID: {$samuel->id}\n";
    } else {
        echo "✅ Samuel exists with ID: {$samuel->id}\n";
    }

    // 2. Check branches
    $branches = Branch::all();
    echo "✅ Found " . $branches->count() . " branches\n";
    
    if ($branches->count() === 0) {
        echo "❌ No branches found. Please run the branch seeder first.\n";
        exit;
    }

    // 3. Clear existing schedules for Samuel
    Schedule::where('optometrist_id', $samuel->id)->delete();
    echo "✅ Cleared existing schedules for Samuel\n";

    // 4. Create new schedules
    $scheduleData = [
        ['day' => 1, 'branch_code' => 'UNITOP', 'start' => '09:00', 'end' => '17:00'],
        ['day' => 2, 'branch_code' => 'NEWSTAR', 'start' => '09:00', 'end' => '17:00'],
        ['day' => 3, 'branch_code' => 'GARNET', 'start' => '09:00', 'end' => '17:00'],
        ['day' => 4, 'branch_code' => 'EMERALD', 'start' => '09:00', 'end' => '17:00'],
        ['day' => 5, 'branch_code' => 'UNITOP', 'start' => '09:00', 'end' => '17:00'],
        ['day' => 6, 'branch_code' => 'NEWSTAR', 'start' => '09:00', 'end' => '17:00'],
        ['day' => 7, 'branch_code' => 'GARNET', 'start' => '10:00', 'end' => '16:00'],
    ];

    $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    $created = 0;

    foreach ($scheduleData as $schedule) {
        $branch = $branches->where('code', $schedule['branch_code'])->first();
        
        if ($branch) {
            Schedule::create([
                'optometrist_id' => $samuel->id,
                'branch_id' => $branch->id,
                'day_of_week' => $schedule['day'],
                'start_time' => $schedule['start'],
                'end_time' => $schedule['end'],
                'is_active' => true,
            ]);
            
            echo "✅ {$days[$schedule['day']-1]}: {$branch->name} ({$schedule['start']} - {$schedule['end']})\n";
            $created++;
        } else {
            echo "❌ Branch {$schedule['branch_code']} not found\n";
        }
    }

    echo "\n✅ Created {$created} schedule entries\n";

    // 5. Test the API response
    $schedules = Schedule::with(['optometrist', 'branch'])
        ->where('is_active', true)
        ->orderBy('day_of_week')
        ->get()
        ->groupBy('optometrist_id');

    if ($schedules->count() > 0) {
        $firstDoctor = $schedules->first()->first()->optometrist;
        
        $formattedSchedules = $schedules->map(function ($doctorSchedules, $doctorId) {
            $doctor = $doctorSchedules->first()->optometrist;
            
            return [
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                ],
                'schedule' => $doctorSchedules->map(function ($schedule) {
                    $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    return [
                        'day_of_week' => $schedule->day_of_week,
                        'day_name' => $dayNames[$schedule->day_of_week - 1],
                        'branch' => [
                            'id' => $schedule->branch->id,
                            'name' => $schedule->branch->name,
                            'code' => $schedule->branch->code,
                        ],
                        'start_time' => date("h:i A", strtotime($schedule->start_time)),
                        'end_time' => date("h:i A", strtotime($schedule->end_time)),
                        'time_range' => date("h:i A", strtotime($schedule->start_time)) . ' - ' . date("h:i A", strtotime($schedule->end_time)),
                    ];
                })
            ];
        });

        echo "\n=== API RESPONSE PREVIEW ===\n";
        echo json_encode($formattedSchedules->first(), JSON_PRETTY_PRINT);
        echo "\n\n✅ Schedule data is ready!\n";
    } else {
        echo "❌ No schedules found after creation\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
