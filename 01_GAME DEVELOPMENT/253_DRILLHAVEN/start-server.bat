@echo off
cd /d "%~dp0"
echo Starting 253_DRILLBAY on port 5353 ...
set PORT=5353
set VQ_OPEN=1
node server.js
pause
