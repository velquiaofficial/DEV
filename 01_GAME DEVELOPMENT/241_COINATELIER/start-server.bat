@echo off
cd /d "%~dp0"
echo Starting 241_COINMILL on port 5341 ...
set PORT=5341
set VQ_OPEN=1
node server.js
pause
