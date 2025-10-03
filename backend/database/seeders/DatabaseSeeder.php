<?php

namespace Database\Seeders;

use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Note: Admin user should be created manually in production
        // This seeder is disabled for security reasons

        // Run other seeders
        $this->call([
            // ComprehensiveDummyDataSeeder::class, // Disabled to use real product data
            ScheduleSeeder::class,
        ]);
    }
}
