# PowerShell script to analyze your eyeglass frames folder
param(
    [string]$FolderPath = "C:\Users\prota\Downloads\Eyeglass_Frames-20251005T184121Z-1-001\Eyeglass_Frames"
)

Write-Host "🔍 Analyzing your eyeglass frames folder..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

if (-not (Test-Path $FolderPath)) {
    Write-Host "❌ Folder not found: $FolderPath" -ForegroundColor Red
    exit 1
}

# Count files and directories
$imageExtensions = @('.jpg', '.jpeg', '.png', '.gif', '.webp')
$totalFiles = 0
$totalDirs = 0
$structure = @{}

Get-ChildItem -Path $FolderPath -Recurse | ForEach-Object {
    if ($_.PSIsContainer) {
        $totalDirs++
    } else {
        if ($imageExtensions -contains $_.Extension.ToLower()) {
            $totalFiles++
        }
    }
}

Write-Host "📊 Analysis Results:" -ForegroundColor Green
Write-Host "   Total image files: $totalFiles" -ForegroundColor White
Write-Host "   Total directories: $totalDirs" -ForegroundColor White
Write-Host ""

Write-Host "📁 Folder Structure:" -ForegroundColor Yellow
Get-ChildItem -Path $FolderPath -Directory | ForEach-Object {
    $subPath = $_.FullName
    $imageCount = (Get-ChildItem -Path $subPath -Recurse -File | Where-Object { $imageExtensions -contains $_.Extension.ToLower() }).Count
    $dirCount = (Get-ChildItem -Path $subPath -Directory).Count
    
    Write-Host "   $($_.Name)/" -ForegroundColor Cyan
    if ($imageCount -gt 0) {
        Write-Host "     📸 $imageCount image files" -ForegroundColor White
    }
    if ($dirCount -gt 0) {
        Write-Host "     📁 $dirCount subdirectories" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🎯 Intelligent Upload Capabilities:" -ForegroundColor Green
Write-Host "   ✅ Branded frames (Brand → Shape → Color)" -ForegroundColor White
Write-Host "   ✅ Non-branded frames (Shape → Color)" -ForegroundColor White
Write-Host "   ✅ Contact lenses (Numbered images)" -ForegroundColor White
Write-Host "   ✅ Solutions (Numbered images)" -ForegroundColor White
Write-Host "   ✅ Sunglasses (Branded & Non-branded)" -ForegroundColor White

Write-Host ""
Write-Host "📦 Creating ZIP archive for upload..." -ForegroundColor Cyan

# Create ZIP file
$zipPath = "eyeglass_frames_organized.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($FolderPath, $zipPath)

$zipSize = (Get-Item $zipPath).Length / 1MB

Write-Host "✅ ZIP file created: $zipPath" -ForegroundColor Green
Write-Host "   Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Ready for Intelligent Upload!" -ForegroundColor Green
Write-Host "   • Upload the ZIP file using the Intelligent Bulk Upload feature" -ForegroundColor White
Write-Host "   • The AI will automatically categorize all products" -ForegroundColor White
Write-Host "   • Set default prices and stock quantities" -ForegroundColor White
Write-Host "   • Review and approve the created products" -ForegroundColor White

Write-Host ""
Write-Host "💡 Recommendations:" -ForegroundColor Yellow
Write-Host "   • Set a default price (e.g., ₱500-2000 for frames)" -ForegroundColor White
Write-Host "   • Set default stock (e.g., 10-50 units)" -ForegroundColor White
Write-Host "   • Review product names and descriptions after upload" -ForegroundColor White
Write-Host "   • Update prices based on brand and quality" -ForegroundColor White




