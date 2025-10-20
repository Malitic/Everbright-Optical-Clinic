# Test JSON response fix
Write-Host "Testing backend JSON response..."

$body = @{
    email = "admin@everbright.com"
    password = "password123"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    
    Write-Host "✅ Status Code: $($response.StatusCode)"
    Write-Host "Response Content:"
    Write-Host $response.Content
    
    # Try to parse as JSON
    try {
        $jsonResponse = $response.Content | ConvertFrom-Json
        Write-Host "✅ JSON parsing successful!"
        Write-Host "User role: $($jsonResponse.user.role)"
    } catch {
        Write-Host "❌ JSON parsing failed: $($_.Exception.Message)"
    }
    
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)"
}
