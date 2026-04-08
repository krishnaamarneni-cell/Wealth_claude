@echo off
title WealthClaude Logs
cd /d "%~dp0..\logs"
echo ============================================
echo   WealthClaude Processor Logs
echo ============================================
echo.
if exist "unified_*.log" (
    echo Showing latest log:
    echo.
    for /f "delims=" %%i in ('dir /b /o-d unified_*.log') do (
        type "%%i"
        goto :done
    )
) else (
    echo No logs found. Start a processor first.
)
:done
echo.
pause
