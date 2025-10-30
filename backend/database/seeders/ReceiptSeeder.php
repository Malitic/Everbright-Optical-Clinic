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
                'patient_id' => $customers->first()->id,
                'branch_id' => $branches->first()->id,
                'appointment_id' => $appointments->first()->id ?? null,
                'customer_name' => 'John Doe',
                'items' => [
                    [
                        'description' => 'Comprehensive Eye Exam',
                        'qty' => 1,
                        'unit_price' => 150.00,
                        'amount' => 150.00
                    ],
                    [
                        'description' => 'Progressive Lenses',
                        'qty' => 1,
                        'unit_price' => 350.00,
                        'amount' => 350.00
                    ],
                    [
                        'description' => 'Anti-Reflective Coating',
                        'qty' => 1,
                        'unit_price' => 85.00,
                        'amount' => 85.00
                    ]
                ],
                'total_sales' => 585.00,
                'vatable_sales' => 535.32,
                'add_vat' => 49.68,
                'total_due' => 585.00,
                'sales_type' => 'charge',
                'date' => now()->subDays(5),
            ],
            [
                'patient_id' => $customers->count() > 1 ? $customers->get(1)->id : $customers->first()->id,
                'branch_id' => $branches->count() > 1 ? $branches->get(1)->id : $branches->first()->id,
                'appointment_id' => $appointments->count() > 1 ? $appointments->get(1)->id : null,
                'customer_name' => 'Jane Smith',
                'items' => [
                    [
                        'description' => 'Contact Lens Fitting',
                        'qty' => 1,
                        'unit_price' => 75.00,
                        'amount' => 75.00
                    ],
                    [
                        'description' => 'Daily Contact Lenses (3-month supply)',
                        'qty' => 1,
                        'unit_price' => 120.00,
                        'amount' => 120.00
                    ]
                ],
                'total_sales' => 195.00,
                'vatable_sales' => 178.90,
                'add_vat' => 16.10,
                'total_due' => 195.00,
                'sales_type' => 'cash',
                'date' => now()->subDays(10),
            ],
            [
                'patient_id' => $customers->count() > 2 ? $customers->get(2)->id : $customers->first()->id,
                'branch_id' => $branches->count() > 2 ? $branches->get(2)->id : $branches->first()->id,
                'appointment_id' => $appointments->count() > 2 ? $appointments->get(2)->id : null,
                'customer_name' => 'Mike Johnson',
                'items' => [
                    [
                        'description' => 'Emergency Eye Consultation',
                        'qty' => 1,
                        'unit_price' => 200.00,
                        'amount' => 200.00
                    ],
                    [
                        'description' => 'Eye Drops (Prescription)',
                        'qty' => 2,
                        'unit_price' => 25.00,
                        'amount' => 50.00
                    ]
                ],
                'total_sales' => 250.00,
                'vatable_sales' => 229.36,
                'add_vat' => 20.64,
                'total_due' => 250.00,
                'sales_type' => 'charge',
                'date' => now()->subDays(15),
            ]
        ];

        foreach ($sampleReceipts as $receiptData) {
            Receipt::create([
                'invoice_no' => Receipt::generateReceiptNumber(),
                'patient_id' => $receiptData['patient_id'],
                'branch_id' => $receiptData['branch_id'],
                'appointment_id' => $receiptData['appointment_id'],
                'customer_name' => $receiptData['customer_name'],
                'items' => $receiptData['items'],
                'total_sales' => $receiptData['total_sales'],
                'vatable_sales' => $receiptData['vatable_sales'],
                'add_vat' => $receiptData['add_vat'],
                'total_due' => $receiptData['total_due'],
                'sales_type' => $receiptData['sales_type'],
                'date' => $receiptData['date'],
            ]);
        }

        $this->command->info('Sample receipts created successfully!');
    }
}
