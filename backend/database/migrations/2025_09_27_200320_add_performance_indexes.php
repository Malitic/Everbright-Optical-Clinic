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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasIndex('products', 'products_name_index')) {
                $table->index('name');
            }
            if (!Schema::hasIndex('products', 'products_created_by_index')) {
                $table->index('created_by');
            }
        });

        Schema::table('branch_stock', function (Blueprint $table) {
            if (!Schema::hasIndex('branch_stock', 'branch_stock_product_id_branch_id_index')) {
                $table->index(['product_id', 'branch_id']);
            }
            if (!Schema::hasIndex('branch_stock', 'branch_stock_stock_quantity_index')) {
                $table->index('stock_quantity');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasIndex('users', 'users_email_index')) {
                $table->index('email');
            }
            if (!Schema::hasIndex('users', 'users_role_index')) {
                $table->index('role');
            }
            if (!Schema::hasIndex('users', 'users_is_approved_index')) {
                $table->index('is_approved');
            }
        });

        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasIndex('appointments', 'appointments_appointment_date_start_time_index')) {
                $table->index(['appointment_date', 'start_time']);
            }
            if (!Schema::hasIndex('appointments', 'appointments_status_index')) {
                $table->index('status');
            }
            if (!Schema::hasIndex('appointments', 'appointments_branch_id_index')) {
                $table->index('branch_id');
            }
        });

        Schema::table('reservations', function (Blueprint $table) {
            if (!Schema::hasIndex('reservations', 'reservations_status_index')) {
                $table->index('status');
            }
            if (!Schema::hasIndex('reservations', 'reservations_branch_id_index')) {
                $table->index('branch_id');
            }
            if (!Schema::hasIndex('reservations', 'reservations_user_id_index')) {
                $table->index('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_active', 'created_at']);
            $table->dropIndex(['name']);
            $table->dropIndex(['created_by']);
        });

        Schema::table('branch_stock', function (Blueprint $table) {
            $table->dropIndex(['product_id', 'branch_id']);
            $table->dropIndex(['stock_quantity']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropIndex(['role']);
            $table->dropIndex(['is_approved']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['appointment_date', 'start_time']);
            $table->dropIndex(['status']);
            $table->dropIndex(['branch_id']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['user_id']);
        });
    }
};