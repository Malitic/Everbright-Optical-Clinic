# Test correct credentials
Write-Host "Testing correct credentials..."

$testAccounts = @(
    @{ email = "admin@everbright.com"; password = "password123"; role = "admin" },
    @{ email = "staff@everbright.com"; password = "password123"; role = "staff" },
    @{ email = "customer@everbright.com"; password = "password123"; role = "customer" },
    @{ email = "optometrist@everbright.com"; password = "password123"; role = "optometrist" }
)

foreach ($account in $testAccounts) {
    Write-Host "Testing $($account.role) login..."
    
    $body = @{
        email = $account.email
        password = $account.password
        role = $account.role
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
        
        if ($response.StatusCode -eq 200) {
            $jsonResponse = $response.Content | ConvertFrom-Json
            Write-Host "✅ $($account.role) login successful - role: $($jsonResponse.user.role)" -ForegroundColor Green
        } else {
            Write-Host "❌ $($account.role) login failed - status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($account.role) login failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}
