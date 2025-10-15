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
        Schema::create('confirmation_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token')->unique();
            $table->string('action'); // delete_user, update_user, etc.
            $table->unsignedBigInteger('user_id'); // Who is performing the action
            $table->unsignedBigInteger('target_id'); // What is being acted upon
            $table->string('target_type'); // User, Transaction, etc.
            $table->json('action_data')->nullable(); // Additional data needed for action
            $table->timestamp('expires_at');
            $table->boolean('used')->default(false);
            $table->timestamps();
            
            $table->index('token');
            $table->index(['user_id', 'action']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('confirmation_tokens');
    }
};

