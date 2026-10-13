@echo off
cd /d "%~dp0"
echo Starting 67_SLA_DESK on port 5667 ...
set PORT=5667
set VQ_OPEN=1
node server.js
pause
