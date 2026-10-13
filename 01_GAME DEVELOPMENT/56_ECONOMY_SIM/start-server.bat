@echo off
cd /d "%~dp0"
echo Starting 56_ECONOMY_SIM on port 5656 ...
set PORT=5656
set VQ_OPEN=1
node server.js
pause
