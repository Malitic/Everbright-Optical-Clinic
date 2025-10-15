<?php

require_once 'vendor/autoload.php';

use App\Http\Controllers\RevenueAnalyticsController;
use App\Http\Controllers\ProductAnalyticsController;
use Illuminate\Http\Request;

echo "Testing Analytics Endpoints...\n";

try {
    // Test Revenue Analytics
    echo "Testing RevenueAnalyticsController...\n";
    $revenueController = new RevenueAnalyticsController();
    $request = new Request();
    
    echo "Testing monthly comparison...\n";
    $monthlyResponse = $revenueController->getMonthlyComparison($request);
    echo "Monthly comparison status: " . $monthlyResponse->getStatusCode() . "\n";
    if ($monthlyResponse->getStatusCode() === 200) {
        echo "Monthly comparison data: " . substr($monthlyResponse->getContent(), 0, 200) . "...\n";
    } else {
        echo "Monthly comparison error: " . $monthlyResponse->getContent() . "\n";
    }
    
    echo "\nTesting revenue by service...\n";
    $serviceResponse = $revenueController->getRevenueByService($request);
    echo "Revenue by service status: " . $serviceResponse->getStatusCode() . "\n";
    if ($serviceResponse->getStatusCode() === 200) {
        echo "Revenue by service data: " . substr($serviceResponse->getContent(), 0, 200) . "...\n";
    } else {
        echo "Revenue by service error: " . $serviceResponse->getContent() . "\n";
    }
    
    // Test Product Analytics
    echo "\nTesting ProductAnalyticsController...\n";
    $productController = new ProductAnalyticsController();
    
    echo "Testing top selling products...\n";
    $productsResponse = $productController->getTopSellingProducts($request);
    echo "Top products status: " . $productsResponse->getStatusCode() . "\n";
    if ($productsResponse->getStatusCode() === 200) {
        echo "Top products data: " . substr($productsResponse->getContent(), 0, 200) . "...\n";
    } else {
        echo "Top products error: " . $productsResponse->getContent() . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}