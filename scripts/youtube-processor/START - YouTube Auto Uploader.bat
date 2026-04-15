@echo off
title YouTube Auto Uploader (Checks every 60 seconds)
cd /d "%~dp0"

echo ============================================
echo   YouTube Auto Uploader
echo   Checks for approved videos every 60 sec
echo   KEEP THIS WINDOW OPEN!
echo ============================================
echo.

python processor.py

pause
