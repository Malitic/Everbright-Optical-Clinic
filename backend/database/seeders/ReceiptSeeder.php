<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Receipt;
use App\Models\User;
use App\Models\Branch;
use App\Models\Appointment;

class ReceiptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some customers and branches
        $customers = User::where('role', 'customer')->take(3)->get();
        $branches = Branch::take(3)->get();
        $appointments = Appointment::where('status', 'completed')->take(5)->get();

        if ($customers->isEmpty() || $branches->isEmpty()) {
            $this->command->info('No customers or branches found. Skipping receipt seeding.');
            return;
        }

        $sampleReceipts = [
            [
                'customer_id' => $customers->first()->id,
                'branch_id' => $branches->first()->id,
                'appointment_id' => $appointments->first()->id ?? null,
                'items' => [
                    [
                        'description' => 'Comprehensive Eye Exam',
                        'quantity' => 1,
                        'price' => 150.00,
                        'total' => 150.00
                    ],
                    [
                        'description' => 'Progressive Lenses',
                        'quantity' => 1,
                        'price' => 350.00,
                        'total' => 350.00
                    ],
                    [
                        'description' => 'Anti-Reflective Coating',
                        'quantity' => 1,
                        'price' => 85.00,
                        'total' => 85.00
                    ]
                ],
                'subtotal' => 585.00,
                'tax_amount' => 46.80,
                'total_amount' => 631.80,
                'payment_method' => 'card',
                'payment_status' => 'paid',
                'notes' => 'Regular checkup with new prescription'
            ],
            [
                'customer_id' => $customers->count() > 1 ? $customers->get(1)->id : $customers->first()->id,
                'branch_id' => $branches->count() > 1 ? $branches->get(1)->id : $branches->first()->id,
                'appointment_id' => $appointments->count() > 1 ? $appointments->get(1)->id : null,
                'items' => [
                    [
                        'description' => 'Contact Lens Fitting',
                        'quantity' => 1,
                        'price' => 75.00,
                        'total' => 75.00
                    ],
                    [
                        'description' => 'Daily Contact Lenses (3-month supply)',
                        'quantity' => 1,
                        'price' => 120.00,
                        'total' => 120.00
                    ]
                ],
                'subtotal' => 195.00,
                'tax_amount' => 15.60,
                'total_amount' => 210.60,
                'payment_method' => 'insurance',
                'payment_status' => 'paid',
                'notes' => 'Contact lens consultation and supply'
            ],
            [
                'customer_id' => $customers->count() > 2 ? $customers->get(2)->id : $customers->first()->id,
                'branch_id' => $branches->count() > 2 ? $branches->get(2)->id : $branches->first()->id,
                'appointment_id' => $appointments->count() > 2 ? $appointments->get(2)->id : null,
                'items' => [
                    [
                        'description' => 'Emergency Eye Consultation',
                        'quantity' => 1,
                        'price' => 200.00,
                        'total' => 200.00
                    ],
                    [
                        'description' => 'Eye Drops (Prescription)',
                        'quantity' => 2,
                        'price' => 25.00,
                        'total' => 50.00
                    ]
                ],
                'subtotal' => 250.00,
                'tax_amount' => 20.00,
                'total_amount' => 270.00,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'notes' => 'Emergency consultation for eye irritation'
            ]
        ];

        foreach ($sampleReceipts as $receiptData) {
            Receipt::create([
                'receipt_number' => Receipt::generateReceiptNumber(),
                'customer_id' => $receiptData['customer_id'],
                'branch_id' => $receiptData['branch_id'],
                'appointment_id' => $receiptData['appointment_id'],
                'subtotal' => $receiptData['subtotal'],
                'tax_amount' => $receiptData['tax_amount'],
                'total_amount' => $receiptData['total_amount'],
                'payment_method' => $receiptData['payment_method'],
                'payment_status' => $receiptData['payment_status'],
                'notes' => $receiptData['notes'],
                'items' => $receiptData['items'],
                'created_at' => now()->subDays(rand(1, 30)),
            ]);
        }

        $this->command->info('Sample receipts created successfully!');
    }
}
