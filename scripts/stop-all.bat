@echo off
echo Stopping all WealthClaude processors...
taskkill /F /IM pythonw.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq WealthClaude*" 2>nul
echo.
echo All processors stopped!
pause
