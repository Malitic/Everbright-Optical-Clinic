# Test backend connection
Write-Host "Testing backend connection..."

$body = @{
    email = "admin@everbright.com"
    password = "password123"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "✅ Backend is working! Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ Backend test failed: $($_.Exception.Message)"
}
