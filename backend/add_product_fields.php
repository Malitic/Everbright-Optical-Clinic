<?php
// Quick migration script to add missing product fields
// Run this from the backend directory: php add_product_fields.php

require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Adding missing product fields...\n";

try {
    // Check if columns already exist
    $columns = Capsule::schema()->getColumnListing('products');
    
    $fieldsToAdd = [
        'brand' => 'string',
        'model' => 'string', 
        'sku' => 'string',
        'branch_id' => 'foreignId',
        'primary_image' => 'string',
        'image_metadata' => 'json',
        'attributes' => 'json'
    ];
    
    foreach ($fieldsToAdd as $field => $type) {
        if (!in_array($field, $columns)) {
            echo "Adding column: $field\n";
            
            switch ($type) {
                case 'string':
                    Capsule::schema()->table('products', function (Blueprint $table) use ($field) {
                        $table->string($field)->nullable();
                    });
                    break;
                case 'json':
                    Capsule::schema()->table('products', function (Blueprint $table) use ($field) {
                        $table->json($field)->nullable();
                    });
                    break;
                case 'foreignId':
                    Capsule::schema()->table('products', function (Blueprint $table) use ($field) {
                        $table->foreignId($field)->nullable()->constrained()->onDelete('set null');
                    });
                    break;
            }
        } else {
            echo "Column $field already exists\n";
        }
    }
    
    // Add indexes
    echo "Adding indexes...\n";
    try {
        Capsule::schema()->table('products', function (Blueprint $table) {
            $table->index(['brand']);
            $table->index(['sku']);
            $table->index(['branch_id']);
        });
    } catch (Exception $e) {
        echo "Indexes may already exist: " . $e->getMessage() . "\n";
    }
    
    echo "Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
