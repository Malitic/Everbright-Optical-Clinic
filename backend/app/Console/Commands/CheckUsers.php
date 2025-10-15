<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CheckUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:check {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if a specific user exists or list all users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        if ($email) {
            $this->info("Checking for user: {$email}");
            $user = User::where('email', $email)->first();
            
            if ($user) {
                $this->info("✅ FOUND!");
                $this->line("ID: {$user->id}");
                $this->line("Name: {$user->name}");
                $this->line("Email: {$user->email}");
                $this->line("Role: {$user->role->value}");
                $this->line("Approved: " . ($user->is_approved ? 'Yes' : 'No'));
            } else {
                $this->error("❌ NOT FOUND");
                $this->line("The user {$email} does not exist in the database.");
            }
        } else {
            $this->info("=== All Users in Database ===");
            $users = User::all(['id', 'name', 'email', 'role', 'is_approved']);
            
            if ($users->count() > 0) {
                $this->table(
                    ['ID', 'Name', 'Email', 'Role', 'Approved'],
                    $users->map(function ($user) {
                        return [
                            $user->id,
                            $user->name,
                            $user->email,
                            $user->role->value,
                            $user->is_approved ? 'Yes' : 'No'
                        ];
                    })
                );
            } else {
                $this->line("No users found in the database.");
            }
        }

        return 0;
    }
}