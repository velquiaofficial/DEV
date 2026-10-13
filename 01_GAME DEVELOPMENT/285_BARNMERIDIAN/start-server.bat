@echo off
cd /d "%~dp0"
echo Starting 285_BARNPULSE on port 5385 ...
set PORT=5385
set VQ_OPEN=1
node server.js
pause
