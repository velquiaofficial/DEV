@echo off
cd /d "%~dp0"
echo Starting 250_VEILSTEP on port 5350 ...
set PORT=5350
set VQ_OPEN=1
node server.js
pause
