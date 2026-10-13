@echo off
cd /d "%~dp0"
echo Starting 276_PAIRPULSE on port 5376 ...
set PORT=5376
set VQ_OPEN=1
node server.js
pause
