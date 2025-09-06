Write-Host "🔄 Starting FamilyVine container rebuild with HEIC support..." -ForegroundColor Yellow

# Change to project directory
Set-Location "C:\Users\JWoods\FamilyVine"

Write-Host "📦 Building backend with HEIC support..." -ForegroundColor Blue
docker-compose build --no-cache backend

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend build successful" -ForegroundColor Green
    
    Write-Host "📦 Building frontend with HEIC support..." -ForegroundColor Blue
    docker-compose build --no-cache frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend build successful" -ForegroundColor Green
        
        Write-Host "🚀 Restarting all containers..." -ForegroundColor Blue
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Container restart successful" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎯 HEIC image support is now deployed!" -ForegroundColor Cyan
            Write-Host "   📱 Try uploading .heic files in galleries or member profiles" -ForegroundColor White
            Write-Host "   🔄 Files will be automatically converted to JPEG" -ForegroundColor White  
            Write-Host "   🔍 Check browser console (F12) for processing messages" -ForegroundColor White
        } else {
            Write-Host "❌ Container restart failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")