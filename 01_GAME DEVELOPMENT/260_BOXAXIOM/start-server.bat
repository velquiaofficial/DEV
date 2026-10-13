@echo off
cd /d "%~dp0"
echo Starting 260_BOXLOGIC on port 5360 ...
set PORT=5360
set VQ_OPEN=1
node server.js
pause
