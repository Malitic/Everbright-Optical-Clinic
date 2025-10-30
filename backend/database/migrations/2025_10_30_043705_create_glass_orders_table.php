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
        Schema::create('glass_orders', function (Blueprint $table) {
            $table->id();

            // Patient and appointment references
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('appointment_id')->nullable();

            // Branch and staff references
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('created_by');

            // Order details
            $table->string('order_number')->unique();
            $table->json('prescription_data');
            $table->json('frame_details')->nullable();
            $table->text('special_instructions')->nullable();

            // Order status and timeline
            $table->enum('status', ['pending', 'in_production', 'sent_to_manufacturer', 'completed', 'cancelled'])->default('pending');
            $table->timestamp('production_started_at')->nullable();
            $table->timestamp('sent_to_manufacturer_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('estimated_completion_date')->nullable();

            // Manufacturer information
            $table->string('manufacturer_name')->nullable();
            $table->string('manufacturer_contact')->nullable();
            $table->text('manufacturer_notes')->nullable();

            // Tracking
            $table->string('tracking_number')->nullable();
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->decimal('advance_payment', 10, 2)->nullable();

            $table->timestamps();

            // Foreign keys
            $table->foreign('patient_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('appointment_id')->references('id')->on('appointments')->onDelete('set null');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index(['patient_id', 'status']);
            $table->index(['branch_id', 'status']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('glass_orders');
    }
};
