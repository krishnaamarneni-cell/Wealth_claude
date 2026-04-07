@echo off
:: Starts the video processor in the background
:: Double-click this file to start. Close the window to stop.
:: To run truly in background (survives closing terminal):
::   Right-click > "Create shortcut" > Properties > Run: Minimized

title WealthClaude Video Processor
cd /d "%~dp0"
echo Starting WealthClaude Video Processor...
echo Close this window to stop.
echo.
python video-processor.py --loop
pause
