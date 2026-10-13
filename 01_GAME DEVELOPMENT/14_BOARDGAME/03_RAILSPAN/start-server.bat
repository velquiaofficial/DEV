@echo off
cd /d "%~dp0"
echo Starting 03_RAILSPAN on port 6482 ...
set PORT=6482
set VQ_OPEN=1
node server.js
pause
