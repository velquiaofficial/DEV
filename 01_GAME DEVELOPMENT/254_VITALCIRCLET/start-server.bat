@echo off
cd /d "%~dp0"
echo Starting 254_VITALRING on port 5354 ...
set PORT=5354
set VQ_OPEN=1
node server.js
pause
