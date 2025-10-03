<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Product;
use App\Models\BranchStock;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Reservation;
use App\Enums\UserRole;
use Carbon\Carbon;

class ComprehensiveDummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all branches
        $branches = Branch::all();
        
        if ($branches->isEmpty()) {
            $this->command->error('No branches found. Please run BranchSeeder first.');
            return;
        }

        // Create sample products
        $this->createProducts();
        
        // Create branch stock for each product
        $this->createBranchStock($branches);
        
        // Create sample users for each branch
        $this->createUsers($branches);
        
        // Create sample appointments
        $this->createAppointments($branches);
        
        // Create sample reservations
        $this->createReservations($branches);
        
        $this->command->info('Comprehensive dummy data created successfully!');
    }

    private function createProducts()
    {
        // Get the admin user ID
        $adminUser = User::where('email', 'admin@everbright.com')->first();
        $adminId = $adminUser ? $adminUser->id : 1;
        
        $products = [
            [
                'name' => 'Ray-Ban Aviator Classic',
                'description' => 'Classic aviator sunglasses with UV protection',
                'price' => 8500.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/rayban-aviator-1.jpg', 'products/rayban-aviator-2.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Oakley Holbrook',
                'description' => 'Modern frame design with premium materials',
                'price' => 12000.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/oakley-holbrook-1.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Warby Parker Finch',
                'description' => 'Prescription glasses with blue light filtering',
                'price' => 6500.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/warby-finch-1.jpg', 'products/warby-finch-2.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Tom Ford FT5401',
                'description' => 'Luxury frame with titanium construction',
                'price' => 18000.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/tomford-ft5401-1.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Maui Jim Red Sands',
                'description' => 'Polarized sunglasses for outdoor activities',
                'price' => 9500.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/maui-redsands-1.jpg', 'products/maui-redsands-2.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Persol 649',
                'description' => 'Italian craftsmanship with hand-polished acetate',
                'price' => 15000.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/persol-649-1.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Gucci GG0061S',
                'description' => 'Designer frame with gold accents',
                'price' => 22000.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/gucci-gg0061s-1.jpg', 'products/gucci-gg0061s-2.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Prada PR 01VS',
                'description' => 'Minimalist design with premium acetate',
                'price' => 14000.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/prada-pr01vs-1.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Chanel CH5347',
                'description' => 'Luxury frame with pearl accents',
                'price' => 25000.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/chanel-ch5347-1.jpg']),
                'created_by' => $adminId,
            ],
            [
                'name' => 'Dior DIORSO1',
                'description' => 'Fashion-forward design with metal details',
                'price' => 16000.00,
                'is_active' => true,
                'image_paths' => json_encode(['products/dior-diorso1-1.jpg', 'products/dior-diorso1-2.jpg']),
                'created_by' => $adminId,
            ],
        ];

        foreach ($products as $productData) {
            Product::firstOrCreate(
                ['name' => $productData['name']],
                $productData
            );
        }
    }

    private function createBranchStock($branches)
    {
        $products = Product::all();
        
        foreach ($branches as $branch) {
            foreach ($products as $product) {
                // Random stock levels (some products may not be available in all branches)
                $stockQuantity = rand(0, 50);
                $reservedQuantity = rand(0, min(5, $stockQuantity));
                $availableQuantity = $stockQuantity - $reservedQuantity;
                
                BranchStock::updateOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'stock_quantity' => $stockQuantity,
                        'reserved_quantity' => $reservedQuantity,
                    ]
                );
            }
        }
    }

    private function createUsers($branches)
    {
        // Admin user creation removed for security
        // Admin should be created manually in production

        // User creation removed for security
        // Users should be created manually in production

            // Create sample customers
            for ($i = 1; $i <= 3; $i++) {
                User::firstOrCreate(
                    ['email' => "customer{$i}{$branch->code}@everbright.com"],
                    [
                        'name' => "Customer {$i} - {$branch->name}",
                        'password' => bcrypt('password'),
                        'role' => UserRole::CUSTOMER,
                        'branch_id' => $branch->id,
                        'email_verified_at' => now(),
                    ]
                );
            }
        }
    }

    private function createAppointments($branches)
    {
        $optometrists = User::where('role', UserRole::OPTOMETRIST)->get();
        $customers = User::where('role', UserRole::CUSTOMER)->get();

        foreach ($branches as $branch) {
            $branchOptometrists = $optometrists->where('branch_id', $branch->id);
            $branchCustomers = $customers->where('branch_id', $branch->id);

            for ($i = 0; $i < 15; $i++) {
                $date = Carbon::now()->addDays(rand(-30, 30));
                $time = Carbon::createFromTime(rand(9, 17), rand(0, 1) * 30, 0);
                
                $customer = $branchCustomers->random();
                $optometrist = $branchOptometrists->random();
                $endTime = $time->copy()->addHour();
                
                Appointment::create([
                    'patient_id' => $customer->id,
                    'optometrist_id' => $optometrist->id,
                    'appointment_date' => $date->format('Y-m-d'),
                    'start_time' => $time->format('H:i:s'),
                    'end_time' => $endTime->format('H:i:s'),
                    'type' => ['Eye Exam', 'Prescription Check', 'Frame Fitting', 'Follow-up'][rand(0, 3)],
                    'status' => ['scheduled', 'completed', 'cancelled'][rand(0, 2)],
                    'notes' => 'Sample appointment notes',
                    'branch_id' => $branch->id,
                ]);
            }
        }
    }

    private function createReservations($branches)
    {
        $customers = User::where('role', UserRole::CUSTOMER)->get();
        $products = Product::all();

        foreach ($branches as $branch) {
            $branchCustomers = $customers->where('branch_id', $branch->id);
            $branchProducts = $products->random(rand(5, 8)); // Random selection of products

            foreach ($branchProducts as $product) {
                $customer = $branchCustomers->random();
                
                Reservation::create([
                    'user_id' => $customer->id,
                    'product_id' => $product->id,
                    'branch_id' => $branch->id,
                    'quantity' => rand(1, 3),
                    'reserved_at' => Carbon::now()->addDays(rand(1, 14)),
                    'status' => ['pending', 'approved', 'completed', 'rejected'][rand(0, 3)],
                    'notes' => 'Sample reservation notes',
                ]);
            }
        }
    }
}
