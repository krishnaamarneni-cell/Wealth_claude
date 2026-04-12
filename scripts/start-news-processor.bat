@echo off
echo ==========================================
echo  WealthClaude News Image Processor
echo ==========================================
echo.
echo This will:
echo  1. Fetch top 3 CNBC articles
echo  2. Generate Instagram images with AI
echo  3. Screenshot with Playwright
echo  4. Upload to Cloudinary
echo  5. Send to Make.com → Instagram
echo.

cd /d "%~dp0"

REM Check if running in loop mode
if "%1"=="--loop" (
    echo Mode: Continuous loop (polls every 5 min)
    python news-image-processor.py --fetch --loop
) else (
    echo Mode: Single run (fetch + process)
    python news-image-processor.py --fetch
)

pause
