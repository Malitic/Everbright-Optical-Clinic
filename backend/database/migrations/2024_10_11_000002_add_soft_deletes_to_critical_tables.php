<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add soft deletes to critical tables to prevent permanent data loss
     * Data is never truly deleted, only marked as deleted
     */
    public function up(): void
    {
        // Add soft deletes to prescriptions
        if (Schema::hasTable('prescriptions') && !Schema::hasColumn('prescriptions', 'deleted_at')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to transactions
        if (Schema::hasTable('transactions') && !Schema::hasColumn('transactions', 'deleted_at')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to users (deactivate accounts instead of delete)
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to receipts
        if (Schema::hasTable('receipts') && !Schema::hasColumn('receipts', 'deleted_at')) {
            Schema::table('receipts', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('prescriptions', 'deleted_at')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('transactions', 'deleted_at')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('receipts', 'deleted_at')) {
            Schema::table('receipts', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};


