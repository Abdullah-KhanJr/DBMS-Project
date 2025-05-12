# Start server script for PowerShell
Write-Host "Starting Attendance System Server..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot
node src/backend/server.js