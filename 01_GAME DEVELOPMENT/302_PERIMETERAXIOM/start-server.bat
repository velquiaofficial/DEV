@echo off
cd /d "%~dp0"
echo Starting 302_PERIMETER on port 5402 ...
set PORT=5402
set VQ_OPEN=1
node server.js
pause
