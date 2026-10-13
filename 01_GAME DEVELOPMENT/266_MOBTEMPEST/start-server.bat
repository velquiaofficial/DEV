@echo off
cd /d "%~dp0"
echo Starting 266_MOBWAVE on port 5366 ...
set PORT=5366
set VQ_OPEN=1
node server.js
pause
