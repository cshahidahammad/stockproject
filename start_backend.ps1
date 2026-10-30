# PowerShell script to start the FastAPI backend service
$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot
Set-Location $workspaceRoot

# Ensure python and node are in PATH
$env:PATH = "$workspaceRoot\.venv\Scripts;C:\Users\lloke\.local\bin;$env:PATH"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Starting Stock Market Trend Analysis Backend (FastAPI) " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Backend API URL:       http://localhost:8000" -ForegroundColor Green
Write-Host "Interactive API Docs:  http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Alternative ReDoc:     http://localhost:8000/redoc" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan

python -m uvicorn app.main:app --reload --app-dir backend --host 127.0.0.1 --port 8000
