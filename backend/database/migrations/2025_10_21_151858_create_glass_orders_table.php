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
            $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('prescription_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('receipt_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            
            // Reserved product information
            $table->json('reserved_products')->nullable(); // Store reserved product details
            
            // Prescription details
            $table->json('prescription_data')->nullable(); // Store prescription information
            
            // Glass specifications
            $table->string('frame_type')->nullable();
            $table->string('lens_type')->nullable();
            $table->string('lens_coating')->nullable();
            $table->boolean('blue_light_filter')->default(false);
            $table->boolean('progressive_lens')->default(false);
            $table->boolean('bifocal_lens')->default(false);
            $table->string('lens_material')->nullable();
            $table->string('frame_material')->nullable();
            $table->string('frame_color')->nullable();
            $table->string('lens_color')->nullable();
            
            // Manufacturer contact information
            $table->text('special_instructions')->nullable();
            $table->text('manufacturer_notes')->nullable();
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['pending', 'sent_to_manufacturer', 'in_production', 'ready_for_pickup', 'delivered', 'cancelled'])->default('pending');
            
            // Contact tracking
            $table->timestamp('sent_to_manufacturer_at')->nullable();
            $table->timestamp('expected_delivery_date')->nullable();
            $table->text('manufacturer_feedback')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['patient_id', 'status']);
            $table->index(['branch_id', 'status']);
            $table->index('priority');
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
