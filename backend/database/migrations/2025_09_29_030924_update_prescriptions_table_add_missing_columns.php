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
        // First, drop the index that includes status
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropIndex('prescriptions_patient_id_status_index');
        });
        
        // Then drop the status column
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        
        // Add all new columns
        Schema::table('prescriptions', function (Blueprint $table) {
            // Add missing columns
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('prescription_number')->nullable()->unique();
            
            // Add new eye examination columns
            $table->json('right_eye')->nullable();
            $table->json('left_eye')->nullable();
            $table->string('vision_acuity')->nullable();
            $table->text('additional_notes')->nullable();
            
            // Add prescription recommendation columns
            $table->text('recommendations')->nullable();
            $table->string('lens_type')->nullable();
            $table->string('coating')->nullable();
            
            // Add follow-up columns
            $table->date('follow_up_date')->nullable();
            $table->text('follow_up_notes')->nullable();
            
            // Add new status column with new enum values
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
        });
        
        // Recreate the index with the new status column
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->index(['patient_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // Remove added columns
            $table->dropColumn([
                'branch_id',
                'prescription_number',
                'right_eye',
                'left_eye',
                'vision_acuity',
                'additional_notes',
                'recommendations',
                'lens_type',
                'coating',
                'follow_up_date',
                'follow_up_notes'
            ]);
        });
    }
};
