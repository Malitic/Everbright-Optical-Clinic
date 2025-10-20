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
        // Temporarily disable FK checks to allow dropping parent table referenced by child tables
        Schema::disableForeignKeyConstraints();

        // Drop the old receipts table
        Schema::dropIfExists('receipts');
        
        // Create new receipts table with the correct structure
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('appointment_id');
            $table->string('sales_type')->default('cash');
            $table->date('date');
            $table->string('customer_name');
            $table->string('tin')->nullable();
            $table->text('address')->nullable();
            $table->decimal('vatable_sales', 10, 2)->default(0);
            $table->decimal('vat_amount', 10, 2)->default(0);
            $table->decimal('zero_rated_sales', 10, 2)->default(0);
            $table->decimal('vat_exempt_sales', 10, 2)->default(0);
            $table->decimal('net_of_vat', 10, 2)->default(0);
            $table->decimal('less_vat', 10, 2)->default(0);
            $table->decimal('add_vat', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('withholding_tax', 10, 2)->default(0);
            $table->decimal('total_due', 10, 2)->default(0);
            $table->timestamps();

            $table->foreign('appointment_id')->references('id')->on('appointments')->onDelete('cascade');
        });

        // Re-enable FK checks
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn(['sales_type', 'date', 'customer_name', 'tin', 'address', 'vatable_sales', 'vat_amount', 'zero_rated_sales', 'vat_exempt_sales', 'net_of_vat', 'less_vat', 'add_vat', 'discount', 'withholding_tax', 'total_due']);
            
            // Restore old columns
            $table->string('receipt_number')->unique();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('reservation_id')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_method')->default('cash');
            $table->string('payment_status')->default('paid');
            $table->text('notes')->nullable();
            $table->json('items');
        });
    }
};
