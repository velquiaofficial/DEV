@echo off
cd /d "%~dp0"
echo Starting 170_FIREFACT on port 5270 ...
set PORT=5270
set VQ_OPEN=1
node server.js
pause
