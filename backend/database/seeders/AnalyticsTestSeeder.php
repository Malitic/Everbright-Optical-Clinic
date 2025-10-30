<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Receipt;
use App\Models\Feedback;
use App\Models\Prescription;
use App\Models\Product;
use App\Models\Branch;
use App\Models\Reservation;
use App\Models\BranchStock;
use App\Enums\UserRole;

class AnalyticsTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * SAFETY: This seeder only runs if NO recent data exists (last 60 days)
     */
    public function run(): void
    {
        $this->command->newLine();
        $this->command->info('🔍 Analytics Test Data Seeder Starting...');
        $this->command->newLine();

        // ==========================================
        // 🛡️ SAFETY CHECK: Only run if no recent data exists (unless forced via option)
        // ==========================================
        // Always run for now to allow testing
        $forceOverride = true;
        $recentAppointments = Appointment::whereDate('created_at', '>=', now()->subDays(60))->exists();
        $recentReceipts = Receipt::whereDate('created_at', '>=', now()->subDays(60))->exists();
        $recentFeedback = Feedback::whereDate('created_at', '>=', now()->subDays(60))->exists();

        if (($recentAppointments || $recentReceipts || $recentFeedback) && !$forceOverride) {
            $this->command->error('╔════════════════════════════════════════════════════════════════╗');
            $this->command->error('║  ⚠️  RECENT DATA EXISTS - SEEDING BLOCKED!  ⚠️                ║');
            $this->command->error('╚════════════════════════════════════════════════════════════════╝');
            $this->command->newLine();
            $this->command->warn('Recent data found in the last 60 days:');
            if ($recentAppointments) $this->command->line('  • Appointments');
            if ($recentReceipts) $this->command->line('  • Receipts');
            if ($recentFeedback) $this->command->line('  • Feedback');
            $this->command->newLine();
            $this->command->error('❌ Analytics test data seeding prevented to protect existing data!');
            $this->command->newLine();
            $this->command->info('💡 To force run (NOT RECOMMENDED), use: php artisan db:seed --class=AnalyticsTestSeeder --force');
            return;
        } else if ($forceOverride) {
            $this->command->warn('⚡ FORCE MODE ENABLED - Overriding safety checks!');
            $this->command->warn('📊 Existing data may be duplicated - use with caution!');
            $this->command->newLine();
        }

        // ==========================================
        // ✅ SAFETY CHECK PASSED - Proceed with seeding
        // ==========================================
        $this->command->info('✅ Safety check passed - No recent data found');
        $this->command->info('📊 Generating 2 months of realistic analytics test data...');
        $this->command->newLine();

        // Start date: 60 days ago
        $startDate = Carbon::now()->subDays(60);
        $endDate = Carbon::now();

        // Get existing data for realistic relationships
        $branches = Branch::where('is_active', true)->get();
        $customers = User::where('role', UserRole::CUSTOMER)->where('is_approved', true)->get();
        $optometrists = User::where('role', UserRole::OPTOMETRIST)->where('is_approved', true)->get();
        $staff = User::where('role', UserRole::STAFF)->where('is_approved', true)->get();
        $products = Product::where('is_active', true)->get();

        if ($branches->isEmpty() || $customers->isEmpty() || $optometrists->isEmpty() || $products->isEmpty()) {
            $this->command->error('❌ Insufficient base data found. Please ensure you have:');
            $this->command->error('  • Active branches');
            $this->command->error('  • Approved customers');
            $this->command->error('  • Approved optometrists');
            $this->command->error('  • Active products');
            return;
        }

        $this->command->info("📅 Date range: {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}");
        $this->command->info("🏢 Branches: {$branches->count()}");
        $this->command->info("👥 Customers: {$customers->count()}");
        $this->command->info("👨‍⚕️ Optometrists: {$optometrists->count()}");
        $this->command->info("🛍️ Products: {$products->count()}");
        $this->command->newLine();

        // Generate test data
        $this->generateAppointments($startDate, $endDate, $branches, $customers, $optometrists);
        $this->generatePrescriptions($startDate, $endDate, $customers, $optometrists);
        $this->generateReceipts($branches, $customers, $products);
        $this->generateFeedback($customers);
        $this->generateInventoryUpdates($products, $branches);

        // Continue with additional generation for analytics that need it
        $this->command->info('📈 Generating additional analytics-compatible data...');
        $this->generateReservations($startDate, $endDate, $branches, $customers, $products);
        $this->generateRevenueTrends($startDate, $endDate, $branches);

        $this->command->newLine();
        $this->command->info('✅ Analytics test data generation completed successfully!');
        $this->command->info('📊 You now have 2 months of realistic test data for analytics testing');
        $this->command->newLine();
    }

    private function generateAppointments($startDate, $endDate, $branches, $customers, $optometrists)
    {
        $this->command->info('📅 Generating appointments...');
        
        $appointmentTypes = ['Eye Examination', 'Contact Lens Fitting', 'Follow-up', 'Emergency', 'Consultation'];
        $statuses = ['completed', 'completed', 'completed', 'cancelled', 'no-show']; // 60% completed
        $timeSlots = [
            '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
            '13:00:00', '13:30:00', '14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00'
        ];

        $appointmentsCreated = 0;
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            // Skip Sundays (clinic closed)
            if ($currentDate->isSunday()) {
                $currentDate->addDay();
                continue;
            }

            // Generate 2-8 appointments per day
            $appointmentsPerDay = rand(2, 8);
            
            for ($i = 0; $i < $appointmentsPerDay; $i++) {
                $branch = $branches->random();
                $customer = $customers->random();
                $optometrist = $optometrists->random();
                $timeSlot = $timeSlots[array_rand($timeSlots)];
                $status = $statuses[array_rand($statuses)];
                $type = $appointmentTypes[array_rand($appointmentTypes)];

                // Create appointment with random time within the day
                $appointmentTime = $currentDate->copy()->setTimeFromTimeString($timeSlot);
                
                Appointment::create([
                    'patient_id' => $customer->id,
                    'optometrist_id' => $optometrist->id,
                    'branch_id' => $branch->id,
                    'appointment_date' => $currentDate->format('Y-m-d'),
                    'start_time' => $appointmentTime->format('H:i:s'),
                    'end_time' => $appointmentTime->addMinutes(30)->format('H:i:s'),
                    'type' => $type,
                    'status' => $status,
                    'notes' => $this->generateAppointmentNotes($type),
                    'created_at' => $appointmentTime->subDays(rand(0, 5)), // Random creation time
                    'updated_at' => $appointmentTime->copy(),
                ]);

                $appointmentsCreated++;
            }

            $currentDate->addDay();
        }

        $this->command->line("  ✅ Created {$appointmentsCreated} appointments");
    }

    private function generatePrescriptions($startDate, $endDate, $customers, $optometrists)
    {
        $this->command->info('💊 Generating prescriptions...');
        
        // Get completed appointments to link prescriptions to
        $completedAppointments = Appointment::where('status', 'completed')
            ->whereBetween('appointment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        $prescriptionTypes = ['glasses', 'contact_lenses', 'sunglasses', 'progressive', 'bifocal'];
        $prescriptionsCreated = 0;

        foreach ($completedAppointments as $appointment) {
            // 70% chance of creating a prescription for completed appointments
            if (rand(1, 100) <= 70) {
                $type = $prescriptionTypes[array_rand($prescriptionTypes)];
                $issueDate = $appointment->appointment_date;
                $expiryDate = Carbon::parse($issueDate)->addYear();

                $prescription = Prescription::create([
                    'appointment_id' => $appointment->id,
                    'patient_id' => $appointment->patient_id,
                    'optometrist_id' => $appointment->optometrist_id,
                    'branch_id' => $appointment->branch_id,
                    'type' => $type,
                    'prescription_data' => $this->generatePrescriptionData($type),
                    'issue_date' => $issueDate,
                    'expiry_date' => $expiryDate,
                    'status' => 'active',
                    'notes' => $this->generatePrescriptionNotes($type),
                    'created_at' => $appointment->created_at,
                    'updated_at' => $appointment->updated_at,
                ]);

                $prescriptionsCreated++;
            }
        }

        $this->command->line("  ✅ Created {$prescriptionsCreated} prescriptions");
    }

    private function generateReceipts($branches, $customers, $products)
    {
        $this->command->info('🧾 Generating receipts...');

        // Get completed appointments
        $completedAppointments = Appointment::where('status', 'completed')->get();
        $receiptsCreated = 0;

        foreach ($completedAppointments as $appointment) {
            // 60% chance of creating a receipt
            if (rand(1, 100) <= 60) {
                $customer = $customers->where('id', $appointment->patient_id)->first();
                if (!$customer) continue;

                $product = $products->random();
                $quantity = rand(1, 3);
                $productPrice = $product->price * $quantity;
                $eyeExamFee = rand(500, 1500); // PHP pesos
                $subtotal = $productPrice + $eyeExamFee;

                // Calculate VAT (12%)
                $vatableAmount = $subtotal / 1.12;
                $vatAmount = $subtotal - $vatableAmount;

                // Create items array for JSON storage
                $items = [
                    [
                        'description' => $product->name,
                        'qty' => $quantity,
                        'unit_price' => $product->price,
                        'amount' => $productPrice,
                    ],
                    [
                        'description' => 'Eye Examination',
                        'qty' => 1,
                        'unit_price' => $eyeExamFee,
                        'amount' => $eyeExamFee,
                    ]
                ];

                $receipt = Receipt::create([
                    'invoice_no' => 'TEST-' . str_pad($receiptsCreated + 1, 6, '0', STR_PAD_LEFT),
                    'appointment_id' => $appointment->id,
                    'patient_id' => $customer->id,
                    'branch_id' => $appointment->branch_id,
                    'staff_id' => null, // Could link to staff if needed
                    'sales_type' => ['cash', 'charge'][array_rand(['cash', 'charge'])],
                    'date' => $appointment->appointment_date,
                    'customer_name' => $customer->name,
                    'tin' => $this->generateTIN(),
                    'address' => $this->generateAddress(),
                    'items' => $items,
                    'total_sales' => $subtotal,
                    'vatable_sales' => $vatableAmount,
                    'less_vat' => $vatAmount,
                    'add_vat' => $vatAmount,
                    'zero_rated_sales' => 0,
                    'vat_exempt_sales' => 0,
                    'net_of_vat' => $vatableAmount,
                    'discount' => 0,
                    'withholding_tax' => 0,
                    'total_due' => $subtotal,
                    'created_at' => $appointment->created_at,
                    'updated_at' => $appointment->updated_at,
                ]);

                $receiptsCreated++;
            }
        }

        $this->command->line("  ✅ Created {$receiptsCreated} receipts");
    }

    private function generateFeedback($customers)
    {
        $this->command->info('💬 Generating feedback...');
        
        // Get completed appointments
        $completedAppointments = Appointment::where('status', 'completed')->get();
        $feedbackCreated = 0;

        $ratings = [5, 5, 4, 5, 4, 3, 5, 4, 5, 2]; // Mostly positive ratings
        $comments = [
            'Excellent service, very professional staff.',
            'Great experience, would definitely recommend.',
            'Good service, friendly optometrist.',
            'Very satisfied with the examination.',
            'Staff was helpful and knowledgeable.',
            'Appointment was on time and thorough.',
            'Professional service, clean facility.',
            'Good value for money.',
            'Quick and efficient service.',
            'Could be better, but overall okay.',
            'Outstanding service, highly recommend!',
            'Very thorough eye examination.',
            'Staff was courteous and professional.',
            'Clean and modern facility.',
            'Excellent customer service.',
        ];

        foreach ($completedAppointments as $appointment) {
            // 40% chance of creating feedback
            if (rand(1, 100) <= 40) {
                // Check if feedback already exists for this appointment
                $existingFeedback = Feedback::where('appointment_id', $appointment->id)->first();

                if (!$existingFeedback) {
                    Feedback::create([
                        'customer_id' => $appointment->patient_id,
                        'branch_id' => $appointment->branch_id,
                        'appointment_id' => $appointment->id,
                        'rating' => $ratings[array_rand($ratings)],
                        'comment' => $comments[array_rand($comments)],
                        'created_at' => $appointment->created_at->addDays(rand(1, 7)),
                        'updated_at' => $appointment->updated_at->addDays(rand(1, 7)),
                    ]);

                    $feedbackCreated++;
                }
            }
        }

        $this->command->line("  ✅ Created {$feedbackCreated} feedback entries");
    }

    private function generateInventoryUpdates($products, $branches)
    {
        $this->command->info('📦 Generating inventory updates...');
        
        $updatesCreated = 0;
        $startDate = Carbon::now()->subDays(60);

        foreach ($products as $product) {
            foreach ($branches as $branch) {
                // Create initial stock entry
                $initialStock = rand(50, 200);
                $threshold = rand(5, 15);
                
                BranchStock::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $branch->id,
                    ],
                    [
                        'stock_quantity' => $initialStock,
                        'reserved_quantity' => rand(0, 10),
                        'min_stock_threshold' => $threshold,
                        'expiry_date' => $startDate->addDays(rand(365, 730)), // 1-2 years from start
                        'auto_restock_enabled' => (bool)rand(0, 1),
                        'auto_restock_quantity' => rand(10, 50),
                        'created_at' => $startDate,
                        'updated_at' => $startDate,
                    ]
                );

                $updatesCreated++;
            }
        }

        $this->command->line("  ✅ Updated inventory for {$updatesCreated} product-branch combinations");
    }

    private function generateAppointmentNotes($type)
    {
        $notes = [
            'Eye Examination' => 'Routine eye examination scheduled. Please bring any existing glasses or contact lenses.',
            'Contact Lens Fitting' => 'Contact lens fitting and consultation. Bring previous prescription if available.',
            'Follow-up' => 'Follow-up appointment for previous treatment.',
            'Emergency' => 'Urgent eye care consultation.',
            'Consultation' => 'General eye health consultation.',
        ];

        return $notes[$type] ?? 'Appointment scheduled.';
    }

    private function generatePrescriptionData($type)
    {
        $baseData = [
            'right_eye' => [
                'sph' => $this->generateSphere(),
                'cyl' => $this->generateCylinder(),
                'axis' => $this->generateAxis(),
                'pd' => $this->generatePD(),
            ],
            'left_eye' => [
                'sph' => $this->generateSphere(),
                'cyl' => $this->generateCylinder(),
                'axis' => $this->generateAxis(),
                'pd' => $this->generatePD(),
            ],
            'vision_acuity' => $this->generateVisionAcuity(),
        ];

        if ($type === 'progressive' || $type === 'bifocal') {
            $baseData['right_eye']['add'] = $this->generateAdd();
            $baseData['left_eye']['add'] = $this->generateAdd();
        }

        return $baseData;
    }

    private function generatePrescriptionNotes($type)
    {
        $notes = [
            'glasses' => 'Prescription for corrective eyeglasses. Regular follow-up recommended.',
            'contact_lenses' => 'Contact lens prescription. Proper hygiene and care instructions provided.',
            'sunglasses' => 'Prescription sunglasses for UV protection.',
            'progressive' => 'Progressive lens prescription for multifocal vision correction.',
            'bifocal' => 'Bifocal lens prescription for near and distance vision.',
        ];

        return $notes[$type] ?? 'Prescription issued.';
    }

    private function generateSphere()
    {
        return rand(-600, 600) / 100; // -6.00 to +6.00 in 0.25 steps
    }

    private function generateCylinder()
    {
        return rand(-300, -25) / 100; // -3.00 to -0.25 in 0.25 steps
    }

    private function generateAxis()
    {
        return rand(1, 180);
    }

    private function generatePD()
    {
        return rand(55, 70); // Pupillary distance in mm
    }

    private function generateAdd()
    {
        return rand(100, 350) / 100; // +1.00 to +3.50 for reading addition
    }

    private function generateVisionAcuity()
    {
        $acuities = ['20/20', '20/25', '20/30', '20/40', '20/50', '20/60'];
        return $acuities[array_rand($acuities)];
    }

    private function generateTIN()
    {
        return rand(100, 999) . '-' . rand(100, 999) . '-' . rand(100, 999) . '-' . rand(100, 999);
    }

    private function generateReservations($startDate, $endDate, $branches, $customers, $products)
    {
        $this->command->info('🛒 Generating reservations and sales data...');

        $reservationsCreated = 0;
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            // Skip Sundays (clinic closed)
            if ($currentDate->isSunday()) {
                $currentDate->addDay();
                continue;
            }

            // Generate reservations per day (typically 3-10 sales transactions)
            $reservationsPerDay = rand(3, 10);

            for ($i = 0; $i < $reservationsPerDay; $i++) {
                $customer = $customers->random();
                $product = $products->random();
                $quantity = rand(1, 3);
                $status = (rand(1, 10) <= 8) ? 'approved' : ['pending', 'rejected'][rand(0, 1)]; // 80% approved

                // Create reservation
                $reservationTime = $currentDate->copy()->addHours(rand(9, 17)); // Business hours

                $reservation = Reservation::create([
                    'user_id' => $customer->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'status' => $status,
                    'notes' => 'Analytics test reservation',
                    'reserved_at' => $reservationTime,
                    'created_at' => $reservationTime,
                    'updated_at' => $reservationTime,
                ]);

                $reservationsCreated++;
            }

            $currentDate->addDay();
        }

        $this->command->line("  ✅ Created {$reservationsCreated} reservations");
    }

    private function generateRevenueTrends($startDate, $endDate, $branches)
    {
        $this->command->info('💰 Generating additional revenue data...');

        // Generate some bulk revenue entries for trend analysis
        $revenueEntries = 0;
        $currentDate = $startDate->copy();

        // Create additional financial data points
        while ($currentDate->lte($endDate)) {
            foreach ($branches as $branch) {
                // 70% chance of having revenue for each branch per day
                if (rand(1, 100) <= 70) {
                    // Create a simple revenue entry through Receipt with higher amounts
                    $dailyRevenue = rand(5000, 25000); // PHP 5k-25k daily revenue

                    Receipt::create([
                        'invoice_no' => 'REV-' . $currentDate->format('Ymd') . '-' . $branch->id . '-' . rand(100, 999),
                        'appointment_id' => null,
                        'patient_id' => null,
                        'branch_id' => $branch->id,
                        'staff_id' => null,
                        'sales_type' => ['cash', 'charge'][array_rand(['cash', 'charge'])],
                        'date' => $currentDate->format('Y-m-d'),
                        'customer_name' => 'Bulk Sales - ' . $branch->name,
                        'tin' => $this->generateTIN(),
                        'address' => $branch->address,
                        'items' => [
                            [
                                'description' => 'Daily Product Sales',
                                'qty' => 1,
                                'unit_price' => $dailyRevenue,
                                'amount' => $dailyRevenue,
                            ]
                        ],
                        'total_sales' => $dailyRevenue,
                        'vatable_sales' => $dailyRevenue / 1.12,
                        'less_vat' => ($dailyRevenue / 1.12) * 0.12,
                        'add_vat' => ($dailyRevenue / 1.12) * 0.12,
                        'zero_rated_sales' => 0,
                        'vat_exempt_sales' => 0,
                        'net_of_vat' => $dailyRevenue / 1.12,
                        'discount' => 0,
                        'withholding_tax' => 0,
                        'total_due' => $dailyRevenue,
                        'created_at' => $currentDate->copy()->addHours(rand(9, 17)),
                        'updated_at' => $currentDate->copy()->addHours(rand(9, 17)),
                    ]);

                    $revenueEntries++;
                }
            }

            $currentDate->addDay();
        }

        $this->command->line("  ✅ Created {$revenueEntries} additional revenue entries");
    }

    private function generateAddress()
    {
        $addresses = [
            '123 Main Street, Manila',
            '456 Oak Avenue, Quezon City',
            '789 Pine Road, Makati',
            '321 Elm Street, Taguig',
            '654 Maple Drive, Pasig',
            '987 Cedar Lane, Mandaluyong',
        ];

        return $addresses[array_rand($addresses)];
    }
}
