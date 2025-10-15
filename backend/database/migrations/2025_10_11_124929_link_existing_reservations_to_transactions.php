<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all approved and completed reservations that don't have transactions yet
        $completedReservations = DB::table('reservations')
            ->whereIn('status', ['approved', 'completed'])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('transactions')
                    ->whereColumn('transactions.reservation_id', 'reservations.id');
            })
            ->get();

        foreach ($completedReservations as $reservation) {
            // Get the customer info
            $customer = DB::table('users')->where('id', $reservation->user_id)->first();
            
            // Get the product info to calculate total amount
            $product = DB::table('products')->where('id', $reservation->product_id)->first();
            
            // Get the first branch (assuming single branch for now)
            $branch = DB::table('branches')->first();
            
            if ($customer && $branch && $product) {
                // Calculate total amount
                $totalAmount = $reservation->quantity * $product->price;
                
                // Create transaction for this reservation
                $transactionId = DB::table('transactions')->insertGetId([
                    'transaction_code' => 'TXN-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
                    'customer_id' => $reservation->user_id,
                    'branch_id' => $branch->id,
                    'appointment_id' => null,
                    'reservation_id' => $reservation->id,
                    'total_amount' => $totalAmount,
                    'status' => 'Completed',
                    'payment_method' => 'Cash',
                    'notes' => 'Auto-created from existing reservation',
                    'created_at' => $reservation->updated_at,
                    'updated_at' => now(),
                ]);

                echo "Created transaction {$transactionId} for reservation {$reservation->id} (Customer: {$customer->name})\n";
            }
        }

        echo "Migration completed. Created transactions for " . $completedReservations->count() . " existing reservations.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove auto-created transactions
        DB::table('transactions')
            ->where('notes', 'Auto-created from existing reservation')
            ->delete();
    }
};
