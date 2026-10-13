@echo off
cd /d "%~dp0"
echo Starting 217_TAPFORGE on port 5317 ...
set PORT=5317
set VQ_OPEN=1
node server.js
pause
