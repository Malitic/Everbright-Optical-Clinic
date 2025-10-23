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
            // Add missing fields that are referenced in ProductController
            if (!Schema::hasColumn('products', 'brand')) {
                $table->string('brand')->nullable()->after('description');
            }
            if (!Schema::hasColumn('products', 'model')) {
                $table->string('model')->nullable()->after('brand');
            }
            if (!Schema::hasColumn('products', 'sku')) {
                $table->string('sku')->nullable()->after('model');
            }
            if (!Schema::hasColumn('products', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null')->after('category_id');
            }
            if (!Schema::hasColumn('products', 'primary_image')) {
                $table->string('primary_image')->nullable()->after('image_paths');
            }
            if (!Schema::hasColumn('products', 'image_metadata')) {
                $table->json('image_metadata')->nullable()->after('primary_image');
            }
            if (!Schema::hasColumn('products', 'attributes')) {
                $table->json('attributes')->nullable()->after('image_metadata');
            }
            
            // Add indexes for better performance
            $table->index(['brand']);
            $table->index(['sku']);
            $table->index(['branch_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['brand']);
            $table->dropIndex(['sku']);
            $table->dropIndex(['branch_id']);
            
            $table->dropForeign(['branch_id']);
            $table->dropColumn([
                'brand',
                'model', 
                'sku',
                'branch_id',
                'primary_image',
                'image_metadata',
                'attributes'
            ]);
        });
    }
};
