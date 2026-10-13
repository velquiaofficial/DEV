@echo off
cd /d "%~dp0"
echo Starting 73_OKR_BOARD on port 5673 ...
set PORT=5673
set VQ_OPEN=1
node server.js
pause
