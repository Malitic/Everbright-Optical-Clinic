<?php
// Simple script to verify the products table was created
require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

// Database configuration
$capsule = new Capsule;

$capsule->addConnection([
    'driver' => 'sqlite',
    'database' => __DIR__ . '/database/database.sqlite',
    'prefix' => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

try {
    if (Capsule::schema()->hasTable('products')) {
        echo "✅ Products table exists!\n";
        
        // Get table columns
        $columns = Capsule::schema()->getColumnListing('products');
        echo "📊 Table columns: " . implode(', ', $columns) . "\n";
    } else {
        echo "❌ Products table does not exist.\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
