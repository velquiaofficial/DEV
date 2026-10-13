@echo off
cd /d "%~dp0"
echo Starting 169_ICEIQ on port 5269 ...
set PORT=5269
set VQ_OPEN=1
node server.js
pause
