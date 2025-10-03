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
        // Modify schedules table to support all staff types
        Schema::table('schedules', function (Blueprint $table) {
            // Rename optometrist_id to staff_id to be more generic
            $table->renameColumn('optometrist_id', 'staff_id');
            
            // Add staff_role column to distinguish between optometrist and staff
            $table->string('staff_role')->default('optometrist')->after('staff_id');
            
            // Add created_by and updated_by for audit trail
            $table->unsignedBigInteger('created_by')->nullable()->after('is_active');
            $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
            
            // Add foreign key constraints
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });

        // Modify schedule_change_requests table to support all staff types
        Schema::table('schedule_change_requests', function (Blueprint $table) {
            // Rename optometrist_id to staff_id
            $table->renameColumn('optometrist_id', 'staff_id');
            
            // Add staff_role column
            $table->string('staff_role')->default('optometrist')->after('staff_id');
            
            // Add requested_by for audit trail
            $table->unsignedBigInteger('requested_by')->nullable()->after('staff_role');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('set null');
        });

        // Update existing data to set staff_role
        DB::table('schedules')->update(['staff_role' => 'optometrist']);
        DB::table('schedule_change_requests')->update(['staff_role' => 'optometrist']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert schedule_change_requests table
        Schema::table('schedule_change_requests', function (Blueprint $table) {
            $table->dropForeign(['requested_by']);
            $table->dropColumn(['requested_by', 'staff_role']);
            $table->renameColumn('staff_id', 'optometrist_id');
        });

        // Revert schedules table
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropForeign(['created_by', 'updated_by']);
            $table->dropColumn(['created_by', 'updated_by', 'staff_role']);
            $table->renameColumn('staff_id', 'optometrist_id');
        });
    }
};
