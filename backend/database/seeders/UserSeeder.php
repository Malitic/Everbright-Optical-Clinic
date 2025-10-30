<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Branch;
use App\Enums\UserRole;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

    class UserSeeder extends Seeder
    {
        /**
         * Run the database seeds.
         */
        public function run(): void
        {
            // Get branches
            $branches = Branch::all();
            $emeraldBranch = $branches->where('name', 'like', '%Emerald%')->first();
            $unitopBranch = $branches->where('name', 'like', '%Unitop%')->first();
            $newstarBranch = $branches->where('name', 'like', '%Newstar%')->first();
            $garnetBranch = $branches->where('name', 'like', '%Garnet%')->first();

            // Default password for all test accounts
            $password = Hash::make('password123');

            $users = [
                // Admin Accounts
                [
                    'name' => 'Main Admin',
                    'email' => 'admin@everbright.com',
                    'password' => $password,
                    'role' => UserRole::ADMIN,
                    'branch_id' => null, // Access to all branches
                    'is_approved' => true,
                ],
                [
                    'name' => 'Admin Emerald',
                    'email' => 'adminEMERALD@everbright.com',
                    'password' => $password,
                    'role' => UserRole::ADMIN,
                    'branch_id' => $emeraldBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Admin Unitop',
                    'email' => 'adminUNITOP@everbright.com',
                    'password' => $password,
                    'role' => UserRole::ADMIN,
                    'branch_id' => $unitopBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Admin Newstar',
                    'email' => 'adminNEWSTAR@everbright.com',
                    'password' => $password,
                    'role' => UserRole::ADMIN,
                    'branch_id' => $newstarBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Admin Garnet',
                    'email' => 'adminGARNET@everbright.com',
                    'password' => $password,
                    'role' => UserRole::ADMIN,
                    'branch_id' => $garnetBranch?->id,
                    'is_approved' => true,
                ],

                // Optometrist Accounts
                [
                    'name' => 'Dr. Samuel Loreto Prieto',
                    'email' => 'samuel.prieto@everbright.com',
                    'password' => $password,
                    'role' => UserRole::OPTOMETRIST,
                    'branch_id' => null, // Rotates across branches
                    'is_approved' => true,
                ],
                [
                    'name' => 'Dr. Samuel Loreto Prieto',
                    'email' => 'samuel@clinic.com',
                    'password' => $password,
                    'role' => UserRole::OPTOMETRIST,
                    'branch_id' => null,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Dr. Optometrist Unitop',
                    'email' => 'optometristUNITOP@everbright.com',
                    'password' => $password,
                    'role' => UserRole::OPTOMETRIST,
                    'branch_id' => $unitopBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Dr. Optometrist Newstar',
                    'email' => 'optometristNEWSTAR@everbright.com',
                    'password' => $password,
                    'role' => UserRole::OPTOMETRIST,
                    'branch_id' => $newstarBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Dr. Optometrist',
                    'email' => 'optometrist@everbright.com',
                    'password' => $password,
                    'role' => UserRole::OPTOMETRIST,
                    'branch_id' => null,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Test Optometrist',
                    'email' => 'optometrist@test.com',
                    'password' => $password,
                    'role' => UserRole::OPTOMETRIST,
                    'branch_id' => null,
                    'is_approved' => true,
                ],

                // Staff Accounts
                [
                    'name' => 'Staff Emerald',
                    'email' => 'staffEMERALD@everbright.com',
                    'password' => $password,
                    'role' => UserRole::STAFF,
                    'branch_id' => $emeraldBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Staff Unitop',
                    'email' => 'staffUNITOP@everbright.com',
                    'password' => $password,
                    'role' => UserRole::STAFF,
                    'branch_id' => $unitopBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Staff Newstar',
                    'email' => 'staffNEWSTAR@everbright.com',
                    'password' => $password,
                    'role' => UserRole::STAFF,
                    'branch_id' => $newstarBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Staff Garnet',
                    'email' => 'staffGARNET@everbright.com',
                    'password' => $password,
                    'role' => UserRole::STAFF,
                    'branch_id' => $garnetBranch?->id,
                    'is_approved' => true,
                ],

                // Customer Accounts
                [
                    'name' => 'Test Customer',
                    'email' => 'customer@test.com',
                    'password' => $password,
                    'role' => UserRole::CUSTOMER,
                    'branch_id' => null,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Customer Emerald',
                    'email' => 'customerEMERALD@everbright.com',
                    'password' => $password,
                    'role' => UserRole::CUSTOMER,
                    'branch_id' => $emeraldBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Customer Unitop',
                    'email' => 'customerUNITOP@everbright.com',
                    'password' => $password,
                    'role' => UserRole::CUSTOMER,
                    'branch_id' => $unitopBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Customer Newstar',
                    'email' => 'customerNEWSTAR@everbright.com',
                    'password' => $password,
                    'role' => UserRole::CUSTOMER,
                    'branch_id' => $newstarBranch?->id,
                    'is_approved' => true,
                ],
                [
                    'name' => 'Customer Garnet',
                    'email' => 'customerGARNET@everbright.com',
                    'password' => $password,
                    'role' => UserRole::CUSTOMER,
                    'branch_id' => $garnetBranch?->id,
                    'is_approved' => true,
                ],
            ];

            foreach ($users as $userData) {
                User::updateOrCreate(
                    ['email' => $userData['email']],
                    $userData
                );
            }

            $this->command->info('Successfully seeded ' . count($users) . ' users!');
        }
    }
