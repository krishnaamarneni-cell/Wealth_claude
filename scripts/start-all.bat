@echo off
title WealthClaude Unified Processor
cd /d "%~dp0"
echo ============================================
echo   WealthClaude Unified Processor
echo   Close this window to stop all processors
echo ============================================
echo.
python wealthclaude-processor.py
pause
