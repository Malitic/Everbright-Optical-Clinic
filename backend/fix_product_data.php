<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Fixing product data...\n";

$products = App\Models\Product::all();

foreach ($products as $product) {
    echo "Processing product: {$product->name}\n";
    
    // Fix image_paths if it's a string
    if (is_string($product->image_paths)) {
        $decoded = json_decode($product->image_paths, true);
        if ($decoded !== null) {
            $product->image_paths = $decoded;
            $product->save();
            echo "  - Fixed image_paths\n";
        }
    }
    
    // Ensure created_by is set
    if (!$product->created_by) {
        $product->created_by = 1; // Set to admin user
        $product->save();
        echo "  - Set created_by to 1\n";
    }
}

echo "Done!\n";
?>

