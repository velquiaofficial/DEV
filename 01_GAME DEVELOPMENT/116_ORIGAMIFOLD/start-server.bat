@echo off
cd /d "%~dp0"
echo Starting 116_TILEFOLD on port 5216 ...
set PORT=5216
set VQ_OPEN=1
node server.js
pause
