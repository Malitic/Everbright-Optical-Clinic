<?php

/**
 * Script to seed sample products into the database
 * Run: php backend/seed_products.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Seeding sample products...\n\n";

try {
    // Run the product seeder
    $seeder = new Database\Seeders\ProductSeeder();
    $seeder->run();
    
    echo "\n✅ Products seeded successfully!\n";
    echo "You can now view the products in the product gallery.\n\n";
    
} catch (Exception $e) {
    echo "\n❌ Error seeding products: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n\n";
    exit(1);
}














