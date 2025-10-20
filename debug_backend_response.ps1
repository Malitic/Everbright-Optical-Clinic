# Debug backend response
Write-Host "Testing backend response..."

$body = @{
    email = "admin@everbright.com"
    password = "password123"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    
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
        Write-Host "User role: $($jsonResponse.user.role)"
    } catch {
        Write-Host "❌ JSON parsing failed: $($_.Exception.Message)"
        Write-Host "First 500 characters of response:"
        Write-Host $response.Content.Substring(0, [Math]::Min(500, $response.Content.Length))
    }
    
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)"
}
