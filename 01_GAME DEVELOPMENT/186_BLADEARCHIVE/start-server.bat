@echo off
cd /d "%~dp0"
echo Starting 186_BLADECARD on port 5286 ...
set PORT=5286
set VQ_OPEN=1
node server.js
pause
