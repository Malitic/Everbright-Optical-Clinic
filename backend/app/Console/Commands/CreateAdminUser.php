<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-admin-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create the admin user account';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // First check if user exists
        $existingUser = \App\Models\User::where('email', 'admin@everbright.com')->first();
        if ($existingUser) {
            $existingUser->password = \Illuminate\Support\Facades\Hash::make('password123');
            $existingUser->role = 'admin';
            $existingUser->is_approved = true;
            $existingUser->is_protected = true;
            $existingUser->save();
            $this->info('Admin user updated successfully!');
        } else {
            $user = new \App\Models\User();
            $user->name = 'Admin User';
            $user->email = 'admin@everbright.com';
            $user->password = \Illuminate\Support\Facades\Hash::make('password123');
            $user->role = 'admin';
            $user->is_approved = true;
            $user->is_protected = true;
            $user->save();
            $this->info('Admin user created successfully!');
        }

        $this->info('Email: admin@everbright.com');
        $this->info('Password: password123');
        $this->info('Role: admin');

        // Also list all users to verify
        $users = \App\Models\User::all();
        $this->info('All users in database:');
        foreach ($users as $user) {
            $this->line("  {$user->email} ({$user->role}) - Approved: " . ($user->is_approved ? 'Yes' : 'No'));
        }
    }
}
