@echo off
echo ================================================
echo Enhanced Head Monitor - Face Tracking System
echo ================================================
echo.
echo Starting facial monitoring system...
echo Press 'q' or ESC to quit
echo Press 'c' to calibrate
echo Press 'k' to toggle Kalman filter
echo Press 'f' to cycle processing speed
echo.
python enhanced_head_monitor.py
echo.
echo Session completed. Check the data folder for logs.
pause
