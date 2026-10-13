@echo off
cd /d "%~dp0"
echo Starting 49_WAYFARE on port 5649 ...
set PORT=5649
set VQ_OPEN=1
node server.js
pause
