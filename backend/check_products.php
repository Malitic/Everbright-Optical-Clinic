<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$product = App\Models\Product::latest()->first();

if ($product) {
    echo "Latest Product:\n";
    echo "Name: " . $product->name . "\n";
    echo "Image Paths: " . json_encode($product->image_paths) . "\n";
    echo "Primary Image: " . $product->primary_image . "\n";
    echo "\nFull URL would be:\n";
    echo "http://localhost:8000/storage/" . ($product->primary_image ?? 'none') . "\n";
} else {
    echo "No products found in database\n";
}

