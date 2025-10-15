<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_code')->unique();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('appointment_id')->nullable();
            $table->unsignedBigInteger('reservation_id')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['Pending', 'Completed', 'Cancelled'])->default('Pending');
            $table->enum('payment_method', ['Cash', 'Credit Card', 'Debit Card', 'Online Payment'])->default('Cash');
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->foreign('appointment_id')->references('id')->on('appointments')->onDelete('set null');
            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('set null');

            // Indexes
            $table->index(['customer_id', 'status']);
            $table->index(['branch_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('transaction_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
