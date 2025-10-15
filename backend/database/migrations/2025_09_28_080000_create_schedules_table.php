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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('users')->onDelete('cascade');
            $table->string('staff_role')->default('optometrist');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->integer('day_of_week'); // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            
            // Ensure unique combination of staff, branch, and day
            $table->unique(['staff_id', 'branch_id', 'day_of_week']);
            
            // Index for efficient queries
            $table->index(['day_of_week', 'is_active']);
            $table->index(['staff_id', 'is_active']);
            
            // Foreign keys for audit trail
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
