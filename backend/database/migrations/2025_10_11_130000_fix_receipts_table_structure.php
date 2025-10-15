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
        Schema::table('receipts', function (Blueprint $table) {
            // Make appointment_id nullable (it was required before)
            $table->unsignedBigInteger('appointment_id')->nullable()->change();
            
            // Add back customer_id and branch_id for reservation-based receipts
            $table->unsignedBigInteger('customer_id')->nullable()->after('id');
            $table->unsignedBigInteger('branch_id')->nullable()->after('customer_id');
            $table->unsignedBigInteger('reservation_id')->nullable()->after('branch_id');
            
            // Add receipt number for tracking
            $table->string('receipt_number')->unique()->nullable()->after('id');
            
            // Add payment fields
            $table->string('payment_method')->default('cash')->after('total_due');
            $table->string('payment_status')->default('paid')->after('payment_method');
            
            // Add foreign keys
            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['reservation_id']);
            
            // Drop columns
            $table->dropColumn(['customer_id', 'branch_id', 'reservation_id', 'receipt_number', 'payment_method', 'payment_status']);
            
            // Make appointment_id required again
            $table->unsignedBigInteger('appointment_id')->nullable(false)->change();
        });
    }
};

