@echo off
cd /d "%~dp0"
echo Starting 84_SPORT_DRILL on port 5684 ...
set PORT=5684
set VQ_OPEN=1
node server.js
pause
