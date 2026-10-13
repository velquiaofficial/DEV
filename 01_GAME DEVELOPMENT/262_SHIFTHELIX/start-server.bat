@echo off
cd /d "%~dp0"
echo Starting 262_SHIFTORBIT on port 5362 ...
set PORT=5362
set VQ_OPEN=1
node server.js
pause
