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
        Schema::table('branch_stock', function (Blueprint $table) {
            $table->date('expiry_date')->nullable()->after('reserved_quantity');
            $table->integer('min_stock_threshold')->default(5)->after('expiry_date');
            $table->boolean('auto_restock_enabled')->default(false)->after('min_stock_threshold');
            $table->integer('auto_restock_quantity')->default(10)->after('auto_restock_enabled');
            $table->timestamp('last_restock_date')->nullable()->after('auto_restock_quantity');
            
            // Add indexes for better performance
            $table->index(['expiry_date']);
            $table->index(['min_stock_threshold']);
            $table->index(['auto_restock_enabled']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_stock', function (Blueprint $table) {
            $table->dropIndex(['expiry_date']);
            $table->dropIndex(['min_stock_threshold']);
            $table->dropIndex(['auto_restock_enabled']);
            
            $table->dropColumn([
                'expiry_date',
                'min_stock_threshold',
                'auto_restock_enabled',
                'auto_restock_quantity',
                'last_restock_date'
            ]);
        });
    }
};
