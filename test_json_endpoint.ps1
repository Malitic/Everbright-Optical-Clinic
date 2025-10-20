# Test JSON endpoint
Write-Host "Testing JSON endpoint..."

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/test-json" -Method GET
    
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Content Length: $($response.Content.Length)"
    Write-Host "Raw Response:"
    Write-Host "----------------------------------------"
    $response.Content
    Write-Host "----------------------------------------"
    
    # Try to parse as JSON
    try {
        $jsonResponse = $response.Content | ConvertFrom-Json
        Write-Host "✅ JSON parsing successful!"
        Write-Host "Message: $($jsonResponse.message)"
    } catch {
        Write-Host "❌ JSON parsing failed: $($_.Exception.Message)"
    }
    
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)"
}
