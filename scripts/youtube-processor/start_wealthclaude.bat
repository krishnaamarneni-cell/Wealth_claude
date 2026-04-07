@echo off
title WealthClaude Master Processor
cd /d "%~dp0"

echo ============================================
echo   WealthClaude Master Processor
echo ============================================
echo.
echo Starting all processors...
echo.
echo   - Account Monitor (every 1 hour)
echo   - Reel Processor (every 1 minute)  
echo   - Video Processor (every 1 minute)
echo   - Cloudinary Cleanup (every 6 hours)
echo.
echo Press Ctrl+C to stop
echo ============================================
echo.

python master_processor.py

pause
