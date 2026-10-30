# PowerShell script to start both Backend and Frontend in separate windows
$workspaceRoot = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Stock Market Trend Analysis Full-Stack Application   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Launching Backend and Frontend in separate terminals..." -ForegroundColor Yellow

# Launch Backend
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$workspaceRoot\start_backend.ps1`""

# Launch Frontend
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$workspaceRoot\start_frontend.ps1`""

Write-Host ""
Write-Host "Both processes started!" -ForegroundColor Green
Write-Host " - Frontend Application:  http://localhost:5173" -ForegroundColor Green
Write-Host " - Backend API:           http://localhost:8000" -ForegroundColor Green
Write-Host " - Swagger Documentation: http://localhost:8000/docs" -ForegroundColor Green
Write-Host " - ReDoc Documentation:   http://localhost:8000/redoc" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
