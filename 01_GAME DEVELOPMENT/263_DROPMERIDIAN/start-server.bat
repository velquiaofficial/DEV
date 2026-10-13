@echo off
cd /d "%~dp0"
echo Starting 263_DROPPULSE on port 5363 ...
set PORT=5363
set VQ_OPEN=1
node server.js
pause
