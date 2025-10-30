<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('appointment_id')->nullable();
            $table->unsignedBigInteger('patient_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('staff_id')->nullable();
            $table->string('invoice_no')->index();
            $table->date('date');
            $table->enum('sales_type', ['cash', 'charge'])->default('cash');
            $table->string('customer_name');
            $table->string('tin')->nullable();
            $table->string('address')->nullable();
            $table->json('items');
            $table->decimal('total_sales', 12, 2)->default(0);
            $table->decimal('vatable_sales', 12, 2)->default(0);
            $table->decimal('less_vat', 12, 2)->default(0);
            $table->decimal('add_vat', 12, 2)->default(0);
            $table->decimal('zero_rated_sales', 12, 2)->default(0);
            $table->decimal('net_of_vat', 12, 2)->default(0);
            $table->decimal('vat_exempt_sales', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('withholding_tax', 12, 2)->default(0);
            $table->decimal('total_due', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};


