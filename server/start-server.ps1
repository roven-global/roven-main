#!/usr/bin/env pwsh

Write-Host "Starting Roven Global Server..." -ForegroundColor Green
Write-Host ""

# Check if port 5000 is available
Write-Host "Checking port 5000..." -ForegroundColor Yellow
$portCheck = netstat -an | Select-String ":5000"
if ($portCheck) {
    Write-Host "Port 5000 is busy. Attempting to free it..." -ForegroundColor Yellow
    npm run port:kill
    Write-Host ""
}

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
npm start

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
