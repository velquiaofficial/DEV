@echo off
cd /d "%~dp0"
echo Starting 231_ROUTEHOLD on port 5331 ...
set PORT=5331
set VQ_OPEN=1
node server.js
pause
