@echo off
cd /d "%~dp0"
echo Starting 27_SHIFT_BOARD on port 5627 ...
set PORT=5627
set VQ_OPEN=1
node server.js
pause
