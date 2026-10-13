@echo off
cd /d "%~dp0"
echo Starting 110_SWEEPFIELD on port 5210 ...
set PORT=5210
set VQ_OPEN=1
node server.js
pause
