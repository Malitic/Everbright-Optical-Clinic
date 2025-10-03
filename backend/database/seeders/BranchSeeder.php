<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Emerald Branch',
                'code' => 'EMERALD',
                'address' => 'Emerald Circle Building, Sta. Cruz, Manila',
                'phone' => '+63 917 123 4567',
                'email' => 'emerald@everbright.com',
                'is_active' => true,
            ],
            [
                'name' => 'Unitop Branch',
                'code' => 'UNITOP',
                'address' => 'Unitop Mall 2nd Floor Foodcourt Area, Balibago Sta. Rosa, Laguna',
                'phone' => '+63 917 234 5678',
                'email' => 'unitop@everbright.com',
                'is_active' => true,
            ],
            [
                'name' => 'Newstar Branch',
                'code' => 'NEWSTAR',
                'address' => 'Newstar Mall, Ground floor Balibago Sta. Rosa Laguna',
                'phone' => '+63 917 345 6789',
                'email' => 'newstar@everbright.com',
                'is_active' => true,
            ],
            [
                'name' => 'Garnet Branch',
                'code' => 'GARNET',
                'address' => 'Garnet St. Corner Emerald, Balibago Sta. Rosa Laguna near balibago church',
                'phone' => '+63 917 456 7890',
                'email' => 'garnet@everbright.com',
                'is_active' => true,
            ],
        ];

        foreach ($branches as $branch) {
            \App\Models\Branch::create($branch);
        }
    }
}
