@echo off
cd /d "%~dp0"
echo Starting 72_CAP_TABLE on port 5672 ...
set PORT=5672
set VQ_OPEN=1
node server.js
pause
