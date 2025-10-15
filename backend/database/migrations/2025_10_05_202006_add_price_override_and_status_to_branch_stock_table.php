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
            // Add price override field (nullable)
            $table->decimal('price_override', 10, 2)->nullable()->after('reserved_quantity');
            
            // Add status field (auto-calculated: "In Stock", "Low Stock", "Out of Stock")
            $table->enum('status', ['In Stock', 'Low Stock', 'Out of Stock'])->default('In Stock')->after('price_override');
            
            // Add index for status field for better performance
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_stock', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['price_override', 'status']);
        });
    }
};