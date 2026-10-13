@echo off
cd /d "%~dp0"
echo Starting 210_NEONGROW on port 5310 ...
set PORT=5310
set VQ_OPEN=1
node server.js
pause
