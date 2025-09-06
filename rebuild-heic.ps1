Write-Host "🔄 Starting FamilyVine container rebuild with HEIC support..." -ForegroundColor Yellow

# Change to project directory
Set-Location "C:\Users\JWoods\FamilyVine"

Write-Host "📦 Building backend with HEIC support..." -ForegroundColor Blue
docker-compose build --no-cache backend

Write-Host "📦 Building frontend with HEIC support..." -ForegroundColor Blue  
docker-compose build --no-cache frontend

Write-Host "🚀 Restarting all containers..." -ForegroundColor Blue
docker-compose up -d

Write-Host "✅ HEIC image support deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Test HEIC support:" -ForegroundColor Cyan
Write-Host "   📱 Try uploading .heic files in galleries or member profiles" -ForegroundColor White
Write-Host "   🔄 Files will be automatically converted to JPEG" -ForegroundColor White  
Write-Host "   🔍 Check browser console (F12) for processing messages" -ForegroundColor White