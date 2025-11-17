# Enhanced Head Monitor - PowerShell Runner
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Enhanced Head Monitor - Face Tracking System" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting facial monitoring system..." -ForegroundColor Green
Write-Host "Press 'q' or ESC to quit" -ForegroundColor Yellow
Write-Host "Press 'c' to calibrate" -ForegroundColor Yellow
Write-Host "Press 'k' to toggle Kalman filter" -ForegroundColor Yellow
Write-Host "Press 'f' to cycle processing speed" -ForegroundColor Yellow
Write-Host ""

python enhanced_head_monitor.py

Write-Host ""
Write-Host "Session completed. Check the data folder for logs." -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
