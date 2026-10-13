@echo off
cd /d "%~dp0"
echo Starting 16_SHORT_VIDEO on port 5616 ...
set PORT=5616
set VQ_OPEN=1
node server.js
pause
