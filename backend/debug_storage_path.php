<?php
// Debug storage path parsing

$requestUri = '/api-mysql.php/storage/products/0crCKFjjfAodstzAXZthCdJatILf4UvJsQ7YjDcc.jpg';
echo "Original URI: $requestUri\n";

$path = $requestUri;
$path = str_replace('/api-mysql.php/storage/', '', $path);
$path = str_replace('/storage/', '', $path);

echo "After replacements: $path\n";

$fullPath = __DIR__ . '/../../storage/app/public/' . $path;
echo "Full path: $fullPath\n";

echo "File exists: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
echo "Is file: " . (is_file($fullPath) ? 'YES' : 'NO') . "\n";

if (file_exists($fullPath)) {
    echo "File size: " . filesize($fullPath) . " bytes\n";
    echo "MIME type: " . mime_content_type($fullPath) . "\n";
}
?>
