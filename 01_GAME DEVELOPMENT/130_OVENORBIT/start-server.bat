@echo off
cd /d "%~dp0"
echo Starting 130_BAKELOOP on port 5230 ...
set PORT=5230
set VQ_OPEN=1
node server.js
pause
