@echo off
cd /d "%~dp0"
echo Starting 43_NIGHT_SCRIPT on port 5643 ...
set PORT=5643
set VQ_OPEN=1
node server.js
pause
