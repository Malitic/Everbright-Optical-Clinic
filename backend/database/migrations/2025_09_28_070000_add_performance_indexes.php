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
        // Add indexes for frequently queried columns
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasIndex('products', 'products_name_index')) {
                $table->index('name');
            }
            if (!Schema::hasIndex('products', 'products_is_active_index')) {
                $table->index('is_active');
            }
            if (!Schema::hasIndex('products', 'products_created_by_index')) {
                $table->index('created_by');
            }
            if (!Schema::hasIndex('products', 'products_created_at_index')) {
                $table->index('created_at');
            }
        });

        Schema::table('branch_stock', function (Blueprint $table) {
            // Skip this index as it already exists as a unique constraint
            // if (!Schema::hasIndex('branch_stock', 'branch_stock_product_id_branch_id_unique')) {
            //     $table->index(['product_id', 'branch_id']);
            // }
            if (!Schema::hasIndex('branch_stock', 'branch_stock_available_quantity_index')) {
                $table->index(['stock_quantity', 'reserved_quantity']);
            }
        });

        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasIndex('appointments', 'appointments_branch_date_index')) {
                $table->index(['branch_id', 'appointment_date']);
            }
            if (!Schema::hasIndex('appointments', 'appointments_status_index')) {
                $table->index('status');
            }
        });

        Schema::table('reservations', function (Blueprint $table) {
            // Skip this index as it already exists from add_branch_id_to_reservations_table migration
            // if (!Schema::hasIndex('reservations', 'reservations_branch_status_index')) {
            //     $table->index(['branch_id', 'status']);
            // }
            if (!Schema::hasIndex('reservations', 'reservations_created_at_index')) {
                $table->index('created_at');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasIndex('users', 'users_email_index')) {
                $table->index('email');
            }
            if (!Schema::hasIndex('users', 'users_role_index')) {
                $table->index('role');
            }
            if (!Schema::hasIndex('users', 'users_branch_id_index')) {
                $table->index('branch_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['created_by']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('branch_stock', function (Blueprint $table) {
            $table->dropIndex(['product_id', 'branch_id']);
            $table->dropIndex(['stock_quantity', 'reserved_quantity']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'appointment_date']);
            $table->dropIndex(['status']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropIndex(['role']);
            $table->dropIndex(['branch_id']);
        });
    }
};
