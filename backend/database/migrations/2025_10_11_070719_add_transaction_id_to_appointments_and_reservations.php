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
        // Add transaction_id to appointments table
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('transaction_id')->nullable()->after('notes');
            $table->index('transaction_id');
        });

        // Add transaction_id to reservations table
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('transaction_id')->nullable()->after('notes');
            $table->index('transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['transaction_id']);
            $table->dropColumn('transaction_id');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['transaction_id']);
            $table->dropColumn('transaction_id');
        });
    }
};
