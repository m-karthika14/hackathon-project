@echo off
echo ================================================
echo Enhanced Head Monitor - Setup
echo ================================================
echo.
echo Installing required dependencies...
echo This may take a few minutes...
echo.

pip install -r requirements.txt

if %errorlevel% equ 0 (
    echo.
    echo ✅ Installation completed successfully!
    echo.
    echo You can now run the enhanced head monitor using:
    echo   - run_enhanced_monitor.bat  (double-click)
    echo   - python enhanced_head_monitor.py
    echo.
) else (
    echo.
    echo ❌ Installation failed. Please check your Python and pip installation.
    echo.
)

pause
