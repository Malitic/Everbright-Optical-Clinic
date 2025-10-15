<?php

namespace Database\Seeders;

use App\Models\Branch;
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
                'address' => 'Emerald Avenue, Sta Rosa, Laguna',
                'phone' => '+63 912 345 6701',
                'email' => 'emerald@everbright.com',
                'is_active' => true,
            ],
            [
                'name' => 'Unitop Branch',
                'code' => 'UNITOP',
                'address' => 'Unitop Center, Cabuyao, Laguna',
                'phone' => '+63 912 345 6702',
                'email' => 'unitop@everbright.com',
                'is_active' => true,
            ],
            [
                'name' => 'Newstar Branch',
                'code' => 'NEWSTAR',
                'address' => 'Newstar Plaza, Biñan, Laguna',
                'phone' => '+63 912 345 6703',
                'email' => 'newstar@everbright.com',
                'is_active' => true,
            ],
            [
                'name' => 'Garnet Branch',
                'code' => 'GARNET',
                'address' => 'Garnet Street, Calamba, Laguna',
                'phone' => '+63 912 345 6704',
                'email' => 'garnet@everbright.com',
                'is_active' => true,
            ],
        ];

        foreach ($branches as $branchData) {
            Branch::updateOrCreate(
                ['code' => $branchData['code']],
                $branchData
            );
        }

        $this->command->info('Successfully seeded ' . count($branches) . ' branches!');
    }
}

