@echo off
cd /d "%~dp0"
echo Starting 249_CROPORBIT on port 5349 ...
set PORT=5349
set VQ_OPEN=1
node server.js
pause
