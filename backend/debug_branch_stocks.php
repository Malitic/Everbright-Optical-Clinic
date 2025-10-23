<?php
// Debug branch_stocks JSON parsing

$testJson = '[{"branch_id":1,"stock_quantity":25},{"branch_id":2,"stock_quantity":15},{"branch_id":3,"stock_quantity":10}]';
echo "Test JSON: $testJson\n";

$decoded = json_decode($testJson, true);
echo "Decoded: " . print_r($decoded, true) . "\n";

if (is_array($decoded)) {
    echo "Is array: YES\n";
    echo "Count: " . count($decoded) . "\n";
    
    foreach ($decoded as $branchStock) {
        echo "Branch ID: " . $branchStock['branch_id'] . ", Stock: " . $branchStock['stock_quantity'] . "\n";
    }
} else {
    echo "Is array: NO\n";
}
?>
