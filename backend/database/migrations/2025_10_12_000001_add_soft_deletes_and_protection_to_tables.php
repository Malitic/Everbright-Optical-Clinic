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
        // Add soft deletes and protection flag to users table (if not already exists)
        if (!Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
        
        if (!Schema::hasColumn('users', 'is_protected')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_protected')->default(false)->after('is_approved');
            });
        }

        // Add soft deletes to transactions table
        if (!Schema::hasColumn('transactions', 'deleted_at')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to reservations table
        if (!Schema::hasColumn('reservations', 'deleted_at')) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to appointments table
        if (!Schema::hasColumn('appointments', 'deleted_at')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to receipts table
        if (!Schema::hasColumn('receipts', 'deleted_at')) {
            Schema::table('receipts', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add soft deletes to prescriptions table
        if (!Schema::hasColumn('prescriptions', 'deleted_at')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
        
        // Add soft deletes to products table
        if (!Schema::hasColumn('products', 'deleted_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
        
        if (Schema::hasColumn('users', 'is_protected')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_protected');
            });
        }

        if (Schema::hasColumn('transactions', 'deleted_at')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('reservations', 'deleted_at')) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('appointments', 'deleted_at')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('receipts', 'deleted_at')) {
            Schema::table('receipts', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('prescriptions', 'deleted_at')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
        
        if (Schema::hasColumn('products', 'deleted_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};

