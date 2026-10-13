@echo off
cd /d "%~dp0"
echo Starting 192_DUNEHAND on port 5292 ...
set PORT=5292
set VQ_OPEN=1
node server.js
pause
