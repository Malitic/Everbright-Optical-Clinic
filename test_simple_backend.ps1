# Test simple backend response
Write-Host "Testing simple backend response..."

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/test_simple_response.php" -Method GET
    
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Content Length: $($response.Content.Length)"
    Write-Host "Raw Response:"
    Write-Host "----------------------------------------"
    $response.Content
    Write-Host "----------------------------------------"
    
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)"
}
