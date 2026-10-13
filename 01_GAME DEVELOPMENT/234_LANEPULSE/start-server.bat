@echo off
cd /d "%~dp0"
echo Starting 234_LANEBEAT on port 5334 ...
set PORT=5334
set VQ_OPEN=1
node server.js
pause
