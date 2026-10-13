@echo off
cd /d "%~dp0"
echo Starting 204_CANDYSUDO on port 5304 ...
set PORT=5304
set VQ_OPEN=1
node server.js
pause
