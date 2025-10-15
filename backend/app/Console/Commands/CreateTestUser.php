<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Enums\UserRole;
use App\Models\Branch;
use Illuminate\Support\Facades\Hash;

class CreateTestUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test admin and optometrist accounts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Creating test accounts...');

        // Get the first branch for optometrist
        $branch = Branch::first();
        if (!$branch) {
            $this->error('No branches found. Please run branch seeder first.');
            return 1;
        }

        // Create Admin Account
        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Test Admin',
                'password' => Hash::make('password123'),
                'role' => UserRole::ADMIN,
                'is_approved' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create Optometrist Account
        $optometrist = User::firstOrCreate(
            ['email' => 'optometrist@test.com'],
            [
                'name' => 'Test Optometrist',
                'password' => Hash::make('password123'),
                'role' => UserRole::OPTOMETRIST,
                'branch_id' => $branch->id,
                'is_approved' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->info('✅ Test accounts created successfully!');
        $this->newLine();
        
        $this->info('=== ADMIN ACCOUNT ===');
        $this->line('Email: admin@test.com');
        $this->line('Password: password123');
        $this->line('Role: admin');
        $this->line('Status: Approved');
        $this->newLine();

        $this->info('=== OPTOMETRIST ACCOUNT ===');
        $this->line('Email: optometrist@test.com');
        $this->line('Password: password123');
        $this->line('Role: optometrist');
        $this->line('Branch: ' . $branch->name);
        $this->line('Status: Approved');
        $this->newLine();

        $this->info('You can now use these credentials to login to the system.');

        return 0;
    }
}