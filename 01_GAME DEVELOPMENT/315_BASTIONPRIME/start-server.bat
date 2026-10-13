@echo off
cd /d "%~dp0"
echo Starting 315_BASTIONX1 on port 5415 ...
set PORT=5415
set VQ_OPEN=1
node server.js
pause
