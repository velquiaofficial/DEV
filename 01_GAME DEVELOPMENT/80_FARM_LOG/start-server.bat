@echo off
cd /d "%~dp0"
echo Starting 80_FARM_LOG on port 5680 ...
set PORT=5680
set VQ_OPEN=1
node server.js
pause
