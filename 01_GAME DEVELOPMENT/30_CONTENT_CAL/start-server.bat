@echo off
cd /d "%~dp0"
echo Starting 30_CONTENT_CAL on port 5630 ...
set PORT=5630
set VQ_OPEN=1
node server.js
pause
