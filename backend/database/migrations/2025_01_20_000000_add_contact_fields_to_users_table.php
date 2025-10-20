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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('social_media')->nullable()->after('phone');
            $table->text('address')->nullable()->after('social_media');
            $table->date('date_of_birth')->nullable()->after('address');
            $table->string('emergency_contact')->nullable()->after('date_of_birth');
            $table->string('emergency_phone')->nullable()->after('emergency_contact');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'social_media', 
                'address',
                'date_of_birth',
                'emergency_contact',
                'emergency_phone'
            ]);
        });
    }
};
