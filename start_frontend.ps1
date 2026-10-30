# PowerShell script to start the React + Vite frontend development server
$ErrorActionPreference = "Stop"

$workspaceRoot = (Resolve-Path $PSScriptRoot).Path
Set-Location "$workspaceRoot\frontend"

# Ensure Node is in PATH
$env:PATH = "C:\Users\lloke\AppData\Local\Programs\nodejs;C:\Users\lloke\.local\bin;$env:PATH"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Starting Stock Market Trend Analysis Frontend (Vite) " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Local Website URL:     http://localhost:5173" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan

npm run dev
