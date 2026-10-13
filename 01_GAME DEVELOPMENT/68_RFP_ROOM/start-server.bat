@echo off
cd /d "%~dp0"
echo Starting 68_RFP_ROOM on port 5668 ...
set PORT=5668
set VQ_OPEN=1
node server.js
pause
