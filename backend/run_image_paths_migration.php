<?php
// Simple script to run the image_paths migration manually
require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

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
    // Check if image_paths column exists
    $columns = Capsule::schema()->getColumnListing('products');

    if (!in_array('image_paths', $columns)) {
        // Add image_paths column
        Capsule::schema()->table('products', function (Blueprint $table) {
            $table->json('image_paths')->nullable()->after('image_path');
        });

        // Migrate existing data
        $products = Capsule::table('products')->whereNotNull('image_path')->get();
        foreach ($products as $product) {
            Capsule::table('products')
                ->where('id', $product->id)
                ->update(['image_paths' => json_encode([$product->image_path])]);
        }

        // Drop old column
        Capsule::schema()->table('products', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });

        echo "Migration completed successfully! Added image_paths column and migrated data.\n";
    } else {
        echo "image_paths column already exists.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
