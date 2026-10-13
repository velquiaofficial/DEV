@echo off
cd /d "%~dp0"
echo Starting 102_BRICKPULSE on port 5202 ...
set PORT=5202
set VQ_OPEN=1
node server.js
pause
