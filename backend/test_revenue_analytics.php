<?php

require_once 'vendor/autoload.php';

use App\Http\Controllers\RevenueAnalyticsController;
use Illuminate\Http\Request;

echo "Testing Revenue Analytics Endpoints...\n";

try {
    $controller = new RevenueAnalyticsController();
    $request = new Request();
    
    echo "Testing monthly comparison...\n";
    $monthlyResponse = $controller->getMonthlyComparison($request);
    echo "Monthly comparison status: " . $monthlyResponse->getStatusCode() . "\n";
    echo "Monthly comparison data: " . $monthlyResponse->getContent() . "\n";
    
    echo "\nTesting revenue by service...\n";
    $serviceResponse = $controller->getRevenueByService($request);
    echo "Revenue by service status: " . $serviceResponse->getStatusCode() . "\n";
    echo "Revenue by service data: " . $serviceResponse->getContent() . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
