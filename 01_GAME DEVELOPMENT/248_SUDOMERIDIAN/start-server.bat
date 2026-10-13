@echo off
cd /d "%~dp0"
echo Starting 248_SUDOPULSE on port 5348 ...
set PORT=5348
set VQ_OPEN=1
node server.js
pause
